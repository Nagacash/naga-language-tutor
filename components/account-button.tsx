"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

// Header control: Sign out when a session exists, Sign in otherwise.
export function AccountButton() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    authClient
      .getSession()
      .then(({ data }) => { if (active) setEmail(data?.user?.email ?? null); })
      .catch(() => { if (active) setEmail(null); });
    return () => { active = false; };
  }, []);

  if (email === undefined) return null;
  if (!email) return <Link href="/auth/sign-in" className="header-preferences">Sign in</Link>;

  return (
    <button
      type="button"
      className="header-preferences"
      aria-label={`Sign out ${email}`}
      title={`Signed in as ${email}`}
      onClick={async () => {
        const { error } = await authClient.signOut();
        if (error) {
          window.alert("Sign-out failed: " + error.message);
          return;
        }
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}
