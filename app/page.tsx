import Link from "next/link";
import { AccountButton } from "@/components/account-button";
import { BillingButtons } from "@/components/billing-buttons";
import { sessionUser } from "@/lib/auth/session";
import { neonStore } from "@/lib/billing/store";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const user = await sessionUser();
  let subscribed = false;
  if (user) {
    try {
      subscribed = !!(await neonStore().activeSubscriptionFor(user.id));
    } catch {
      subscribed = false;
    }
  }
  return (
    <main className="landing">
      <header className="landing-header">
        <img src="/naga-vox-logo.png" alt="Naga Vox" className="brand-logo-img" />
        <AccountButton />
      </header>
      <section className="landing-hero">
        <p className="landing-kicker">Language practice, by voice</p>
        <h1>Speak it. Hear it. Own it.</h1>
        <p className="landing-lede">
          Guided conversations, instant translation and a tutor that answers you in the language you are learning.
        </p>
        <div className="landing-actions">
          <Link href="/app" className="landing-cta">Start practicing</Link>
          <Link href="/account" className="landing-secondary">Plans and account</Link>
        </div>
        <div className="landing-plans">
          <p className="landing-kicker">{subscribed ? "Your plan is active" : "Unlock full practice"}</p>
          <BillingButtons subscribed={subscribed} />
        </div>
      </section>
    </main>
  );
}
