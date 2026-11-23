import { authServer } from "./server";

// The signed-in user's ID, or null when nobody is signed in or sign-in is not configured.
export async function sessionUserId(): Promise<string | null> {
  try {
    const { data } = await authServer().getSession();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}
