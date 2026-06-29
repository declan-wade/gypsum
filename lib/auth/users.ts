import { prisma } from "@/lib/prisma";

// A login account from Neon Auth's `neon_auth.user` table (better-auth schema).
// This is distinct from the CRM `User` model used for record ownership.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string; // "user" | "admin"
  banned: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

export async function listAuthUsers(): Promise<AuthUser[]> {
  return prisma.$queryRawUnsafe<AuthUser[]>(
    `SELECT id, name, email,
            COALESCE(role, 'user') AS role,
            COALESCE(banned, false) AS banned,
            "emailVerified",
            "createdAt"
     FROM neon_auth."user"
     ORDER BY "createdAt" DESC`
  );
}
