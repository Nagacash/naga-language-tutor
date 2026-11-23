import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingButtons } from "@/components/billing-buttons";
import { priceIdFor } from "@/lib/billing/config";
import { neonStore } from "@/lib/billing/store";
import { sessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

// Account page: who is signed in, their subscription, and the buttons to subscribe or manage it.
export default async function AccountPage() {
  const user = await sessionUser();
  if (!user) redirect("/auth/sign-in");

  let subscription: Awaited<ReturnType<ReturnType<typeof neonStore>["activeSubscriptionFor"]>>;
  let unavailable = false;
  try {
    subscription = await neonStore().activeSubscriptionFor(user.id);
  } catch {
    unavailable = true;
  }

  const monthly = priceIdFor("month");
  const yearly = priceIdFor("year");
  const plan = !subscription
    ? null
    : subscription.priceId && subscription.priceId === yearly
      ? "Yearly"
      : subscription.priceId && subscription.priceId === monthly
        ? "Monthly"
        : "Subscribed";

  return (
    <main className="account-page">
      <Link href="/" className="account-back">← Back to Naga Vox</Link>
      <h1>Your account</h1>
      <p className="account-email">{user.email ?? "Signed in"}</p>
      <section className="account-card">
        <h2>Subscription</h2>
        {unavailable ? (
          <p>Billing is not set up yet.</p>
        ) : subscription ? (
          <>
            <p>Plan: {plan}. Status: {subscription.status}.</p>
            {subscription.currentPeriodEnd && <p>Renews {subscription.currentPeriodEnd.toLocaleDateString()}.</p>}
          </>
        ) : (
          <p>No active subscription.</p>
        )}
        <BillingButtons subscribed={!!subscription} />
      </section>
    </main>
  );
}
