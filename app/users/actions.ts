"use server";

import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";

// These manage Neon Auth login accounts directly against the `neon_auth` schema
// (better-auth tables). Passwords are hashed with better-auth's own hasher so
// the created accounts are sign-in compatible. Sign-ups are disabled, so this
// admin panel is how new login accounts are provisioned.

export async function createAuthUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const userId = randomUUID();
  const accountRowId = randomUUID();
  const passwordHash = await hashPassword(data.password);

  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `INSERT INTO neon_auth."user" (id, name, email, "emailVerified", role, banned, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, $4, false, now(), now())`,
      userId,
      data.name,
      data.email,
      data.role
    ),
    // For the credential provider, accountId equals the user id.
    prisma.$executeRawUnsafe(
      `INSERT INTO neon_auth."account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, now(), now())`,
      accountRowId,
      userId,
      userId,
      passwordHash
    ),
  ]);
}

export async function updateAuthUser(
  id: string,
  data: { name: string; role: string; active: boolean }
) {
  await prisma.$executeRawUnsafe(
    `UPDATE neon_auth."user"
     SET name = $1, role = $2, banned = $3, "updatedAt" = now()
     WHERE id = $4`,
    data.name,
    data.role,
    !data.active,
    id
  );
}

export async function resetAuthUserPassword(id: string, password: string) {
  const passwordHash = await hashPassword(password);
  await prisma.$executeRawUnsafe(
    `UPDATE neon_auth."account"
     SET password = $1, "updatedAt" = now()
     WHERE "userId" = $2 AND "providerId" = 'credential'`,
    passwordHash,
    id
  );
}
