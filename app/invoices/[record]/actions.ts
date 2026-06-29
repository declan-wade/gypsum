"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { recalcInvoiceTotals } from "@/lib/invoice-totals";

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function addInvoiceLineItem(
  invoiceId: string,
  data: {
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    taxable: boolean;
  }
) {
  const position = await prisma.invoiceLineItem.count({ where: { invoiceId } });

  await prisma.invoiceLineItem.create({
    data: {
      invoiceId,
      productId: data.productId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      lineTotal: round2(data.quantity * data.unitPrice),
      taxable: data.taxable,
      position,
    },
  });

  await recalcInvoiceTotals(invoiceId);
  await logActivity({
    entityType: "Invoice",
    entityId: invoiceId,
    action: "UPDATED",
    summary: `Added line item: ${data.description}`,
  });
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function deleteInvoiceLineItem(id: string) {
  const item = await prisma.invoiceLineItem.delete({
    where: { id },
    select: { invoiceId: true, description: true },
  });

  await recalcInvoiceTotals(item.invoiceId);
  await logActivity({
    entityType: "Invoice",
    entityId: item.invoiceId,
    action: "UPDATED",
    summary: `Removed line item: ${item.description}`,
  });
  revalidatePath(`/invoices/${item.invoiceId}`);
}
