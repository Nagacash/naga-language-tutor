import { safeError } from "@/lib/guard";
import { accessFor } from "@/lib/access";
import { appQuery } from "@/lib/billing/store";

export type UsageKind = "recordings" | "speech_chars" | "chat_sessions";

// Monthly allowance for each subscriber. Admins are not limited.
export const MONTHLY_ALLOWANCE: Record<UsageKind, number> = {
  recordings: 60, // each recording is at most 60 seconds, so this is at most 60 minutes
  speech_chars: 150000, // spoken replies, counted in UTF-8 bytes
  chat_sessions: 3, // Continuous chat sessions, each at most 10 minutes
};

export const USAGE_LABELS: Record<UsageKind, string> = {
  recordings: "Recordings",
  speech_chars: "Spoken replies (characters)",
  chat_sessions: "Continuous chat sessions",
};

export function currentPeriod(now = new Date()): string {
  return now.toISOString().slice(0, 7);
}

// Adds to this month's usage only if the total stays within the allowance. The check and the update
// happen in one statement, so parallel requests cannot push a subscriber past the limit.
export async function reserveUsage(userId: string, kind: UsageKind, amount: number): Promise<boolean> {
  const limit = MONTHLY_ALLOWANCE[kind];
  if (amount > limit) return false;
  const { rows } = await appQuery<{ amount: number }>(
    `INSERT INTO billing_usage (user_id, period, kind, amount) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, period, kind) DO UPDATE SET amount = billing_usage.amount + EXCLUDED.amount
     WHERE billing_usage.amount + EXCLUDED.amount <= $5
     RETURNING amount`,
    [userId, currentPeriod(), kind, amount, limit],
  );
  return rows.length > 0;
}

export async function usageFor(userId: string): Promise<Record<UsageKind, number>> {
  const result: Record<UsageKind, number> = { recordings: 0, speech_chars: 0, chat_sessions: 0 };
  const { rows } = await appQuery<{ kind: UsageKind; amount: number }>(
    "SELECT kind, amount FROM billing_usage WHERE user_id = $1 AND period = $2",
    [userId, currentPeriod()],
  );
  for (const row of rows) result[row.kind] = row.amount;
  return result;
}

// Returns an error response when the subscriber has used up this month's allowance for the request, or null when allowed.
export async function quotaDenied(kind: UsageKind, amount: number): Promise<Response | null> {
  if (process.env.ACCESS_GATE === "off") return null;
  const access = await accessFor();
  if (!access.ok) {
    return access.reason === "signed-out"
      ? safeError("Sign in to continue.", 401)
      : safeError("A subscription is needed to continue.", 403);
  }
  if (access.admin) return null;
  if (await reserveUsage(access.userId, kind, amount)) return null;
  return safeError("This month's allowance is used up. It resets on the 1st.", 429);
}
