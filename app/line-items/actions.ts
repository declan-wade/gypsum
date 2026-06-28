"use server";

import { prisma } from "@/lib/prisma";

export async function createLineItem(data: {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}) {
  await prisma.invoiceLineItem.create({
    data: {
      invoiceId: data.invoiceId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      lineTotal: data.quantity * data.unitPrice,
    },
  });
}
