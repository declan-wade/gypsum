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

// Convenience for task assignment: select options + an id→name lookup.
export async function getAuthUserOptions(): Promise<{
  options: { value: string; label: string }[];
  nameById: Map<string, string>;
}> {
  const users = await listAuthUsers();
  return {
    options: users.map((u) => ({ value: u.id, label: u.name })),
    nameById: new Map(users.map((u) => [u.id, u.name])),
  };
}
