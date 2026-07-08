// One-time RBAC backfill: grants every existing non-admin Neon Auth user access
// to all grantable modules, so introducing module-level RBAC doesn't lock
// anyone out. Idempotent (skipDuplicates) — safe to re-run. Admins are skipped
// (they bypass the table). New users get their access set from the Users admin
// form instead.
//
// Run once, AFTER `prisma db push` has created the UserModuleAccess table:
//   bun run scripts/backfill-module-access.ts

import { prisma } from "@/lib/prisma";
import { GRANTABLE_MODULES } from "@/lib/modules";

async function main() {
  const users = await prisma.$queryRaw<{ id: string; role: string | null }[]>`
    SELECT id, role FROM neon_auth."user"
  `;
  const nonAdmins = users.filter((u) => (u.role ?? "user") !== "admin");
  const keys = GRANTABLE_MODULES.map((m) => m.key);

  let granted = 0;
  for (const user of nonAdmins) {
    const result = await prisma.userModuleAccess.createMany({
      data: keys.map((module) => ({ authUserId: user.id, module })),
      skipDuplicates: true,
    });
    granted += result.count;
  }

  console.log(
    `Backfill complete: ${nonAdmins.length} non-admin user(s), ${granted} new grant(s) inserted.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
