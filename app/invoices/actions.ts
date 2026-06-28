"use server";

import { prisma } from "@/lib/prisma";
import type { InvoiceStatus } from "@prisma/client";

export async function createInvoice(data: {
  number: string;
  status: InvoiceStatus;
  companyId: string;
  dueDate: Date | null;
  notes: string | null;
}) {
  await prisma.invoice.create({
    data: {
      number: data.number,
      status: data.status,
      companyId: data.companyId,
      dueDate: data.dueDate,
      notes: data.notes,
    },
  });
}
