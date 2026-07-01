import { prisma } from "@/lib/prisma";

// A login account from Neon Auth's `neon_auth.user` table (better-auth schema).
// This is distinct from the CRM `User` model used for record ownership.
// companyId/companyName come from the CRM-owned `PortalUser` link (client portal
// access); they're null for staff accounts that aren't tied to a company.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string; // "user" | "admin"
  banned: boolean;
  emailVerified: boolean;
  createdAt: Date;
  companyId: string | null;
  companyName: string | null;
}

export async function listAuthUsers(): Promise<AuthUser[]> {
  return prisma.$queryRawUnsafe<AuthUser[]>(
    `SELECT u.id, u.name, u.email,
            COALESCE(u.role, 'user') AS role,
            COALESCE(u.banned, false) AS banned,
            u."emailVerified",
            u."createdAt",
            pu."companyId" AS "companyId",
            c.name AS "companyName"
     FROM neon_auth."user" u
     LEFT JOIN public."PortalUser" pu ON pu."authUserId" = u.id::text
     LEFT JOIN public."Company" c ON c.id = pu."companyId"
     ORDER BY u."createdAt" DESC`
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
