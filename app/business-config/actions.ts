"use server";

import { prisma } from "@/lib/prisma";

export interface BusinessConfigInput {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddressLine1: string | null;
  businessAddressLine2: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessPostcode: string | null;
  abn: string | null;
  payTo: string | null;
  bsb: string | null;
  accountNumber: string | null;
  bankName: string | null;
}

export async function upsertBusinessConfig(data: BusinessConfigInput, id?: string) {
  if (id) {
    return prisma.businessConfig.update({
      where: { id },
      data,
    });
  }

  const existing = await prisma.businessConfig.findFirst();

  if (existing) {
    return prisma.businessConfig.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.businessConfig.create({ data });
}
