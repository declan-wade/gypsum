import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/server";
import {
  computeAccessibleModules,
  hrefsForModuleKeys,
  isAdminRole,
  sanitizeGrantableKeys,
  type ModuleKey,
} from "@/lib/modules";

export interface ModuleAccess {
  user: CurrentUser | null;
  isAdmin: boolean;
  // Module keys this user may access (see lib/modules.ts).
  accessible: Set<string>;
  // Route hrefs for the accessible modules — used to filter the sidebar.
  accessibleHrefs: string[];
}

// Resolves the current user's module access once per request. Admins get
// everything; everyone else gets always-on modules plus their granted set.
// Fails closed: if the permission lookup errors (e.g. the table hasn't been
// migrated yet), non-admins get only the always-on modules rather than being
// silently granted access.
export const getModuleAccess = cache(async (): Promise<ModuleAccess> => {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, isAdmin: false, accessible: new Set(), accessibleHrefs: [] };
  }

  const admin = isAdminRole(user.role);
  let granted: string[] = [];
  if (!admin) {
    try {
      granted = await getGrantedModules(user.id);
    } catch {
      granted = [];
    }
  }

  const accessible = computeAccessibleModules(user.role, granted);
  return {
    user,
    isAdmin: admin,
    accessible,
    accessibleHrefs: hrefsForModuleKeys(accessible),
  };
});

// Boolean access check without redirecting — for API route handlers that need
// to return their own status code (e.g. 403) rather than navigate.
export async function hasModuleAccess(moduleKey: ModuleKey): Promise<boolean> {
  const { user, accessible } = await getModuleAccess();
  return !!user && accessible.has(moduleKey);
}

// Route guard for a module segment. Call from app/<segment>/layout.tsx.
// Redirects unauthenticated users to sign-in and unauthorized users to the
// dashboard, so a direct URL visit can't bypass the sidebar filtering.
export async function requireModuleAccess(moduleKey: ModuleKey): Promise<void> {
  const { user, accessible } = await getModuleAccess();
  if (!user) redirect("/sign-in");
  if (!accessible.has(moduleKey)) redirect("/");
}

// --- Data access -----------------------------------------------------------

export async function getGrantedModules(authUserId: string): Promise<string[]> {
  const rows = await prisma.userModuleAccess.findMany({
    where: { authUserId },
    select: { module: true },
  });
  return rows.map((r) => r.module);
}

// Fetches granted modules for many users at once (for the Users admin table).
export async function getGrantedModulesByUser(
  authUserIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (authUserIds.length === 0) return map;
  const rows = await prisma.userModuleAccess.findMany({
    where: { authUserId: { in: authUserIds } },
    select: { authUserId: true, module: true },
  });
  for (const row of rows) {
    const list = map.get(row.authUserId) ?? [];
    list.push(row.module);
    map.set(row.authUserId, list);
  }
  return map;
}

// Replaces a user's granted modules with the given set (grantable keys only).
export async function setGrantedModules(
  authUserId: string,
  moduleKeys: readonly string[]
): Promise<void> {
  const keys = sanitizeGrantableKeys(moduleKeys);
  await prisma.$transaction([
    prisma.userModuleAccess.deleteMany({ where: { authUserId } }),
    ...(keys.length
      ? [
          prisma.userModuleAccess.createMany({
            data: keys.map((module) => ({ authUserId, module })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}
