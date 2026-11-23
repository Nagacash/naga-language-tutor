import { Pool } from "pg";
import { BillingUnavailableError } from "./config";

export type SubscriptionRecord = {
  subscriptionId: string;
  userId: string;
  customerId: string;
  status: string;
  priceId?: string;
  currentPeriodEnd?: Date;
};

export type RiskEvent = {
  eventId: string;
  type: string;
  customerId?: string;
  subscriptionId?: string;
  chargeId?: string;
};

// Stores Stripe identifiers and subscription state. Keep card data and full Stripe objects out of this database.
export interface BillingStore {
  linkCustomer(userId: string, customerId: string): Promise<void>;
  customerIdFor(userId: string): Promise<string | undefined>;
  userIdForCustomer(customerId: string): Promise<string | undefined>;
  upsertSubscription(record: SubscriptionRecord): Promise<void>;
  recordRiskEvent(event: RiskEvent): Promise<void>;
}

let pool: Pool | undefined;

function db(): Pool {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new BillingUnavailableError("Billing storage needs setup.");
  pool ??= new Pool({ connectionString: url, max: 5 });
  return pool;
}

export function neonStore(): BillingStore {
  return {
    async linkCustomer(userId, customerId) {
      await db().query(
        `INSERT INTO billing_customers (user_id, stripe_customer_id) VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id`,
        [userId, customerId],
      );
    },
    async customerIdFor(userId) {
      const { rows } = await db().query<{ stripe_customer_id: string }>(
        "SELECT stripe_customer_id FROM billing_customers WHERE user_id = $1",
        [userId],
      );
      return rows[0]?.stripe_customer_id;
    },
    async userIdForCustomer(customerId) {
      const { rows } = await db().query<{ user_id: string }>(
        "SELECT user_id FROM billing_customers WHERE stripe_customer_id = $1",
        [customerId],
      );
      return rows[0]?.user_id;
    },
    async upsertSubscription(record) {
      await db().query(
        `INSERT INTO billing_subscriptions
           (subscription_id, user_id, customer_id, status, price_id, current_period_end)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (subscription_id) DO UPDATE SET
           status = EXCLUDED.status,
           price_id = EXCLUDED.price_id,
           current_period_end = EXCLUDED.current_period_end,
           updated_at = now()`,
        [
          record.subscriptionId,
          record.userId,
          record.customerId,
          record.status,
          record.priceId ?? null,
          record.currentPeriodEnd ?? null,
        ],
      );
    },
    async recordRiskEvent(event) {
      await db().query(
        `INSERT INTO billing_risk_events (event_id, type, customer_id, subscription_id, charge_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (event_id) DO NOTHING`,
        [event.eventId, event.type, event.customerId ?? null, event.subscriptionId ?? null, event.chargeId ?? null],
      );
    },
  };
}
