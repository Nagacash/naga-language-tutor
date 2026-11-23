import { safeError } from "@/lib/guard";
import { sessionUser } from "@/lib/auth/session";
import { appQuery, neonStore } from "@/lib/billing/store";

export type AccessResult =
  | { ok: true; userId: string; admin: boolean }
  | { ok: false; reason: "signed-out" | "no-subscription" };

// Access is granted to the admin without a subscription, and to any signed-in user with an active one.
// ACCESS_GATE=off exists only so the automated tests can call the routes without a session.
export async function accessFor(): Promise<AccessResult> {
  const user = await sessionUser();
  if (!user) return { ok: false, reason: "signed-out" };
  try {
    const { rows } = await appQuery<{ role: string | null }>('SELECT role FROM neon_auth."user" WHERE id = $1', [user.id]);
    if (rows[0]?.role === "admin") return { ok: true, userId: user.id, admin: true };
    const subscription = await neonStore().activeSubscriptionFor(user.id);
    if (subscription) return { ok: true, userId: user.id, admin: false };
    return { ok: false, reason: "no-subscription" };
  } catch {
    return { ok: false, reason: "no-subscription" };
  }
}

// Returns an error response for API routes that the caller may not use, or null when access is allowed.
export async function apiAccessDenied(): Promise<Response | null> {
  if (process.env.ACCESS_GATE === "off") return null;
  const access = await accessFor();
  if (access.ok) return null;
  if (access.reason === "signed-out") return safeError("Sign in to continue.", 401);
  return safeError("A subscription is needed to continue.", 403);
}
