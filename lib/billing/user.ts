import { sessionUserId } from "@/lib/auth/session";

// The signed-in subscriber's ID, or null when nobody is signed in.
export async function currentUserId(request: Request): Promise<string | null> {
  void request;
  return sessionUserId();
}
