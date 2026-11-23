import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { POST as checkout } from "../app/api/billing/checkout/route";
import { POST as webhook } from "../app/api/billing/webhook/route";

const origin = "http://127.0.0.1:3101";
const secret = "whsec_test_naga_vox";

function setEnv(values: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

test("checkout stays closed until a subscriber is signed in", async () => {
  setEnv({ STRIPE_SECRET_KEY: "rk_test_placeholder", STRIPE_PRICE_MONTHLY: "price_test_monthly" });
  const response = await checkout(new Request(`${origin}/api/billing/checkout`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ interval: "month" }),
  }));
  assert.equal(response.status, 401);
});

test("webhook rejects requests without a valid Stripe signature", async () => {
  setEnv({ STRIPE_SECRET_KEY: "rk_test_placeholder", STRIPE_WEBHOOK_SECRET: secret });
  const payload = JSON.stringify({ id: "evt_test", type: "customer.subscription.updated", object: "event", data: { object: {} } });
  const unsigned = await webhook(new Request(`${origin}/api/billing/webhook`, { method: "POST", body: payload }));
  assert.equal(unsigned.status, 400);
  const forged = await webhook(new Request(`${origin}/api/billing/webhook`, {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=deadbeef" },
    body: payload,
  }));
  assert.equal(forged.status, 400);
});

test("a correctly signed event is retried, not acknowledged, when storage is not configured", async () => {
  setEnv({ STRIPE_SECRET_KEY: "rk_test_placeholder", STRIPE_WEBHOOK_SECRET: secret, DATABASE_URL: undefined });
  const payload = JSON.stringify({
    id: "evt_test_storage",
    object: "event",
    type: "customer.subscription.updated",
    data: { object: { id: "sub_test", object: "subscription", customer: "cus_test", status: "active", items: { data: [] } } },
  });
  const header = new Stripe("rk_test_placeholder").webhooks.generateTestHeaderString({ payload, secret });
  const response = await webhook(new Request(`${origin}/api/billing/webhook`, {
    method: "POST",
    headers: { "stripe-signature": header },
    body: payload,
  }));
  assert.equal(response.status, 500);
});
