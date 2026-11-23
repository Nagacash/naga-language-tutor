import Stripe from "stripe";

export type BillingInterval = "month" | "year";

export class BillingUnavailableError extends Error {
  constructor(message = "Billing needs setup before it can be used.") {
    super(message);
    this.name = "BillingUnavailableError";
  }
}

let client: Stripe | undefined;

// One Stripe client per process. Use a restricted key (rk_) rather than a secret key.
export function stripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new BillingUnavailableError("Stripe needs setup.");
  client ??= new Stripe(key);
  return client;
}

export function priceIdFor(interval: BillingInterval): string | undefined {
  const name = interval === "year" ? "STRIPE_PRICE_ANNUAL" : "STRIPE_PRICE_MONTHLY";
  return process.env[name]?.trim() || undefined;
}

export function isBillingReady(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
      process.env.DATABASE_URL?.trim() &&
      priceIdFor("month"),
  );
}
