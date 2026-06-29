"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { recalcInvoiceTotals } from "@/lib/invoice-totals";

export async function createLineItem(data: {
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxable: boolean;
}) {
  await prisma.invoiceLineItem.create({
    data: {
      invoiceId: data.invoiceId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      lineTotal: data.quantity * data.unitPrice,
      taxable: data.taxable,
    },
  });
  await recalcInvoiceTotals(data.invoiceId);
  await logActivity({
    entityType: "Invoice",
    entityId: data.invoiceId,
    action: "UPDATED",
    summary: `Added line item: ${data.description}`,
  });
}
