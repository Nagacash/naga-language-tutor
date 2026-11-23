import Link from "next/link";
import { AccountButton } from "@/components/account-button";

export default function Landing() {
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
      </section>
    </main>
  );
}
