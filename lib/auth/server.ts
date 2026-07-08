import { cache } from "react";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { prisma } from "@/lib/prisma";

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
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export interface CurrentUser {
  id: string;
  role: string;
}

// The signed-in user with their Neon Auth role ("admin" | "user" | ...).
// Cached per request so the several call sites (RBAC guard, nav filtering,
// page badges) resolve the session and role only once. Falls back to the
// neon_auth table when the session token doesn't carry the role claim.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const { data } = await auth.getSession();
    const id = data?.user?.id;
    if (!id) return null;

    const sessionRole = (data?.user as { role?: string } | undefined)?.role;
    if (sessionRole) return { id, role: sessionRole };

    const rows = await prisma.$queryRaw<{ role: string | null }[]>`
      SELECT role FROM neon_auth."user" WHERE id = ${id} LIMIT 1
    `;
    return { id, role: rows[0]?.role ?? "user" };
  } catch {
    return null;
  }
});
