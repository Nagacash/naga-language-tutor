"use client";

import "@neondatabase/auth-ui/css";
import { AuthView, NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/auth/client";

export function AuthPanel({ path }: { path: string }) {
  return (
    <NeonAuthUIProvider authClient={authClient}>
      <AuthView path={path} />
    </NeonAuthUIProvider>
  );
}
