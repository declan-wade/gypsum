import { createNeonAuth } from "@neondatabase/auth/next/server";

// Server-side Neon Auth instance. Exposes Better Auth methods
// (auth.getSession, auth.signIn.email, auth.signOut, ...) plus
// auth.handler() for the API route and auth.middleware() for the proxy.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});

// The signed-in Neon Auth user's id (or null), for request-time server code.
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await auth.getSession();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}
