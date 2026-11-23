// Sign-in is not set up yet, so no request is linked to a subscriber and checkout stays closed.
// Replace this with the sign-in provider's session lookup when accounts are added.
export async function currentUserId(request: Request): Promise<string | null> {
  void request;
  return null;
}
