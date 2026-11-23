import { BillingUnavailableError, priceIdFor, stripeClient, type BillingInterval } from "@/lib/billing/config";
import { neonStore } from "@/lib/billing/store";
import { currentUserId } from "@/lib/billing/user";
import { readJson, safeError, sameOrigin } from "@/lib/guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return safeError("Open this practice from Naga Vox.", 403);
  const userId = await currentUserId(request);
  if (!userId) return safeError("Sign in to subscribe.", 401);

  let body: Record<string, unknown>;
  try {
    body = await readJson(request, 1024);
  } catch {
    return safeError("Choose a plan to continue.");
  }
  const interval: BillingInterval = body.interval === "year" ? "year" : "month";
  const price = priceIdFor(interval);
  if (!price) return safeError("Billing needs setup.", 503);

  const origin = new URL(request.url).origin;
  try {
    const customer = await neonStore().customerIdFor(userId);
    const session = await stripeClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: userId,
      ...(customer ? { customer } : {}),
      success_url: `${origin}/?billing=success`,
      cancel_url: `${origin}/?billing=cancelled`,
    });
    if (!session.url) return safeError("Checkout could not start. Please try again.", 502);
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BillingUnavailableError) return safeError(error.message, 503);
    const stripeError = error as { type?: string; code?: string };
    console.error("Checkout failed:", stripeError.type ?? "unknown", stripeError.code ?? "none");
    return safeError("Checkout could not start. Please try again.", 502);
  }
}
