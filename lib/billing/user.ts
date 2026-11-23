import { authServer } from "@/lib/auth/server";

// The signed-in subscriber's ID, or null when nobody is signed in or sign-in is not configured.
export async function currentUserId(request: Request): Promise<string | null> {
  void request;
  try {
    const { data } = await authServer().getSession();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}
