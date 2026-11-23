import { createAuthClient } from "@neondatabase/auth/next";

// Browser client. It talks to the same-origin /api/auth proxy, so it takes no configuration.
export const authClient = createAuthClient();
