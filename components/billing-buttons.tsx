"use client";

import { useState } from "react";

// Starts Stripe Checkout for a new subscription, or opens the Customer Portal for an existing one.
export function BillingButtons({ subscribed }: { subscribed: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function go(path: string, body: Record<string, string> = {}) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        window.location.href = "/auth/sign-in";
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setMessage(data.error ?? "Billing is not available right now.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setMessage("Billing is not available right now.");
      setBusy(false);
    }
  }

  return (
    <div className="billing-actions">
      {subscribed ? (
        <button type="button" className="landing-cta" disabled={busy} onClick={() => go("/api/billing/portal")}>
          Manage subscription
        </button>
      ) : (
        <>
          <button type="button" className="landing-cta" disabled={busy} onClick={() => go("/api/billing/checkout", { interval: "month" })}>
            Subscribe monthly · $9.99
          </button>
          <button type="button" className="landing-secondary" disabled={busy} onClick={() => go("/api/billing/checkout", { interval: "year" })}>
            Subscribe yearly · $99
          </button>
        </>
      )}
      {message && <p role="alert" className="billing-message">{message}</p>}
    </div>
  );
}
