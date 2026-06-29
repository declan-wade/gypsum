"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { InvoiceStatus } from "@prisma/client";

export async function createInvoice(data: {
  number: string;
  status: InvoiceStatus;
  companyId: string;
  dueDate: Date | null;
  notes: string | null;
}) {
  const invoice = await prisma.invoice.create({
    data: {
      number: data.number,
      status: data.status,
      companyId: data.companyId,
      dueDate: data.dueDate,
      notes: data.notes,
    },
  });
  await logActivity({
    entityType: "Invoice",
    entityId: invoice.id,
    action: "CREATED",
    summary: `Created invoice ${invoice.number}`,
  });
}

export async function updateInvoice(
  id: string,
  data: {
    number: string;
    status: InvoiceStatus;
    companyId: string;
    dueDate: Date | null;
    notes: string | null;
  }
) {
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      number: data.number,
      status: data.status,
      companyId: data.companyId,
      dueDate: data.dueDate,
      notes: data.notes,
    },
  });
  await logActivity({
    entityType: "Invoice",
    entityId: id,
    action: "UPDATED",
    summary: `Updated invoice ${invoice.number}`,
  });
}
