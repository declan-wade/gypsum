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

// A portal client is a login tied to a company via PortalUser. These accounts
// exist only to sign in to the separate client-portal project: they must never
// receive internal CRM notifications or access the CRM itself.
export function isPortalClient(user: Pick<AuthUser, "companyId">): boolean {
  return user.companyId !== null;
}

/** Auth users who are CRM staff — i.e. NOT client-portal accounts. Use this
 * (never listAuthUsers) when building notification recipient lists. */
export async function listStaffUsers(): Promise<AuthUser[]> {
  const users = await listAuthUsers();
  return users.filter((u) => !isPortalClient(u));
}

/** Whether a single auth user id belongs to a client-portal account. */
export async function isPortalUserId(authUserId: string): Promise<boolean> {
  const row = await prisma.portalUser.findUnique({
    where: { authUserId },
    select: { id: true },
  });
  return row !== null;
}

// Convenience for task assignment: select options + an id→name lookup.
// Options only include staff (clients can't be assigned CRM work), but the
// name lookup covers everyone so historical records still resolve names.
export async function getAuthUserOptions(): Promise<{
  options: { value: string; label: string }[];
  nameById: Map<string, string>;
}> {
  const users = await listAuthUsers();
  return {
    options: users
      .filter((u) => !isPortalClient(u))
      .map((u) => ({ value: u.id, label: u.name })),
    nameById: new Map(users.map((u) => [u.id, u.name])),
  };
}
