"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { UserRole } from "@prisma/client";

export async function createUser(data: {
  name: string;
  email: string;
  role: UserRole;
}) {
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
    },
  });
  await logActivity({
    entityType: "User",
    entityId: user.id,
    action: "CREATED",
    summary: `Created user ${user.name}`,
  });
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    email: string;
    role: UserRole;
  }
) {
  const user = await prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
    },
  });
  await logActivity({
    entityType: "User",
    entityId: id,
    action: "UPDATED",
    summary: `Updated user ${user.name}`,
  });
}
