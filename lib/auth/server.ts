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
