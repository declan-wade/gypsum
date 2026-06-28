"use server";

import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export async function createUser(data: {
  name: string;
  email: string;
  role: UserRole;
}) {
  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
    },
  });
}
