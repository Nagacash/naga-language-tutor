import { BillingUnavailableError, stripeClient } from "@/lib/billing/config";
import { handleStripeEvent } from "@/lib/billing/events";
import { neonStore } from "@/lib/billing/store";
import { safeError } from "@/lib/guard";

export const runtime = "nodejs";

// Stripe calls this endpoint. Requests are accepted only with a valid signature from the webhook secret.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return safeError("Billing needs setup.", 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return safeError("Invalid webhook.", 400);

  const payload = await request.text();
  let event;
  try {
    event = await stripeClient().webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return safeError("Invalid webhook.", 400);
  }

  try {
    await handleStripeEvent(event, neonStore());
    return Response.json({ received: true });
  } catch (error) {
    // Returning 500 makes Stripe retry the event. Storage errors are never reported to the caller.
    if (!(error instanceof BillingUnavailableError)) console.error("Stripe event failed:", event.type, event.id);
    return new Response("Event not processed.", { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
