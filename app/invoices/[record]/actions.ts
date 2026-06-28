"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const round2 = (n: number) => Math.round(n * 100) / 100;

// Recomputes the denormalised invoice totals from its current line items.
async function recalcInvoiceTotals(invoiceId: string) {
  const items = await prisma.invoiceLineItem.findMany({
    where: { invoiceId },
    include: { taxRate: true },
  });

  let subtotal = 0;
  let taxAmount = 0;
  for (const item of items) {
    const lineTotal = Number(item.lineTotal);
    subtotal += lineTotal;
    if (item.taxRate) {
      taxAmount += lineTotal * Number(item.taxRate.rate);
    }
  }

  subtotal = round2(subtotal);
  taxAmount = round2(taxAmount);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, taxAmount, total: round2(subtotal + taxAmount) },
  });
}

export async function addInvoiceLineItem(
  invoiceId: string,
  data: {
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
  }
) {
  // A product carries its own tax rate; copy it onto the line item.
  const taxRateId = data.productId
    ? (
        await prisma.product.findUnique({
          where: { id: data.productId },
          select: { taxRateId: true },
        })
      )?.taxRateId ?? null
    : null;

  const position = await prisma.invoiceLineItem.count({ where: { invoiceId } });

  await prisma.invoiceLineItem.create({
    data: {
      invoiceId,
      productId: data.productId,
      taxRateId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      lineTotal: round2(data.quantity * data.unitPrice),
      position,
    },
  });

  await recalcInvoiceTotals(invoiceId);
  revalidatePath(`/invoices/${invoiceId}`);
}

export async function deleteInvoiceLineItem(id: string) {
  const item = await prisma.invoiceLineItem.delete({
    where: { id },
    select: { invoiceId: true },
  });

  await recalcInvoiceTotals(item.invoiceId);
  revalidatePath(`/invoices/${item.invoiceId}`);
}
