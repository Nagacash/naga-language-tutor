import type Stripe from "stripe";
import { stripeClient } from "./config";
import type { BillingStore } from "./store";

function idOf(value: string | { id: string } | null | undefined): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

async function syncSubscription(subscription: Stripe.Subscription, store: BillingStore, status?: string) {
  const customerId = idOf(subscription.customer);
  if (!customerId) throw new Error("Subscription has no customer.");
  const userId = await store.userIdForCustomer(customerId);
  // Throwing makes Stripe retry later, which covers the case where the subscription event arrives before checkout links the customer.
  if (!userId) throw new Error("Subscription customer is not linked yet.");
  const item = subscription.items.data[0];
  await store.upsertSubscription({
    subscriptionId: subscription.id,
    userId,
    customerId,
    status: status ?? subscription.status,
    priceId: item?.price.id,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : undefined,
  });
}

// Handles subscription, invoice and risk events. Throws when work cannot be completed so Stripe retries the event.
export async function handleStripeEvent(event: Stripe.Event, store: BillingStore): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = idOf(session.customer);
      if (session.mode !== "subscription" || !userId || !customerId) return;
      await store.linkCustomer(userId, customerId);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncSubscription(event.data.object as Stripe.Subscription, store);
      return;
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object as Stripe.Subscription, store, "canceled");
      return;
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = idOf(invoice.parent?.subscription_details?.subscription);
      if (!subscriptionId) return;
      // Read the current subscription so its status reflects the payment outcome.
      const subscription = await stripeClient().subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription, store);
      return;
    }
    case "charge.dispute.created":
    case "charge.refunded":
    case "radar.early_fraud_warning.created": {
      const object = event.data.object as unknown as { id: string; charge?: unknown; customer?: unknown };
      const chargeId = event.type === "charge.refunded" ? object.id : idOf(object.charge as string | undefined);
      await store.recordRiskEvent({
        eventId: event.id,
        type: event.type,
        customerId: idOf(object.customer as string | undefined),
        chargeId,
      });
      return;
    }
    default:
      return;
  }
}
