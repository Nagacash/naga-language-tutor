import { BillingUnavailableError, stripeClient } from "@/lib/billing/config";
import { neonStore } from "@/lib/billing/store";
import { currentUserId } from "@/lib/billing/user";
import { safeError, sameOrigin } from "@/lib/guard";

export const runtime = "nodejs";

// Opens Stripe's Customer Portal, where subscribers change plan, update payment details or cancel.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return safeError("Open this practice from Naga Vox.", 403);
  const userId = await currentUserId(request);
  if (!userId) return safeError("Sign in to manage your subscription.", 401);

  try {
    const customer = await neonStore().customerIdFor(userId);
    if (!customer) return safeError("No subscription was found for this account.", 404);
    const session = await stripeClient().billingPortal.sessions.create({
      customer,
      return_url: `${new URL(request.url).origin}/`,
    });
    return Response.json({ url: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BillingUnavailableError) return safeError(error.message, 503);
    return safeError("The billing portal could not open. Please try again.", 502);
  }
}
