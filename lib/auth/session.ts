import { authServer } from "./server";

export type SessionUser = { id: string; email: string | null };

// The signed-in user, or null when nobody is signed in or sign-in is not configured.
export async function sessionUser(): Promise<SessionUser | null> {
  try {
    const { data } = await authServer().getSession();
    const user = data?.user;
    return user?.id ? { id: user.id, email: user.email ?? null } : null;
  } catch {
    return null;
  }
}

export async function sessionUserId(): Promise<string | null> {
  return (await sessionUser())?.id ?? null;
}
