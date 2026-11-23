import { createNeonAuth } from "@neondatabase/auth/next/server";

type NeonAuthServer = ReturnType<typeof createNeonAuth>;
let instance: NeonAuthServer | undefined;

// Created on first use so the app can start, and tests can run, before sign-in is configured.
export function authServer(): NeonAuthServer {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const secret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  if (!baseUrl || !secret) throw new Error("Sign-in needs setup.");
  instance ??= createNeonAuth({ baseUrl, cookies: { secret } });
  return instance;
}
