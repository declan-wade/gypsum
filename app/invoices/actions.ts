"use server";

import { start } from "workflow/api";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { notifyInvoiceSent } from "@/lib/email";
import { formatMoney } from "@/lib/format";
import { trackInvoiceOverdue } from "@/workflows/invoice-overdue";
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
    include: { company: { select: { name: true } } },
  });
  await logActivity({
    entityType: "Invoice",
    entityId: invoice.id,
    action: "CREATED",
    summary: `Created invoice ${invoice.number}`,
  });
  if (invoice.status === "SENT") {
    await notifyInvoiceSent({
      number: invoice.number,
      companyName: invoice.company.name,
      total: formatMoney(invoice.total.toString()),
    });
    await start(trackInvoiceOverdue, [invoice.id]);
  }
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
  const previous = await prisma.invoice.findUnique({
    where: { id },
    select: { status: true },
  });

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      number: data.number,
      status: data.status,
      companyId: data.companyId,
      dueDate: data.dueDate,
      notes: data.notes,
    },
    include: { company: { select: { name: true } } },
  });
  await logActivity({
    entityType: "Invoice",
    entityId: id,
    action: "UPDATED",
    summary: `Updated invoice ${invoice.number}`,
  });
  // Only notify on the transition into SENT, not on every save of a sent invoice.
  if (invoice.status === "SENT" && previous?.status !== "SENT") {
    await notifyInvoiceSent({
      number: invoice.number,
      companyName: invoice.company.name,
      total: formatMoney(invoice.total.toString()),
    });
    await start(trackInvoiceOverdue, [id]);
  }
}
