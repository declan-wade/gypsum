"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { recalcQuoteTotals } from "@/lib/quote-totals";

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function addQuoteLineItem(
  quoteId: string,
  data: {
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    taxable: boolean;
  }
) {
  const position = await prisma.quoteLineItem.count({ where: { quoteId } });

  await prisma.quoteLineItem.create({
    data: {
      quoteId,
      productId: data.productId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      lineTotal: round2(data.quantity * data.unitPrice),
      taxable: data.taxable,
      position,
    },
  });

  await recalcQuoteTotals(quoteId);
  await logActivity({
    entityType: "Quote",
    entityId: quoteId,
    action: "UPDATED",
    summary: `Added line item: ${data.description}`,
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteLineItem(
  id: string,
  data: {
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    taxable: boolean;
  }
) {
  const item = await prisma.quoteLineItem.update({
    where: { id },
    data: {
      productId: data.productId,
      description: data.description,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      lineTotal: round2(data.quantity * data.unitPrice),
      taxable: data.taxable,
    },
    select: { quoteId: true, description: true },
  });

  await recalcQuoteTotals(item.quoteId);
  await logActivity({
    entityType: "Quote",
    entityId: item.quoteId,
    action: "UPDATED",
    summary: `Updated line item: ${item.description}`,
  });
  revalidatePath(`/quotes/${item.quoteId}`);
}

export async function deleteQuoteLineItem(id: string) {
  const item = await prisma.quoteLineItem.delete({
    where: { id },
    select: { quoteId: true, description: true },
  });

  await recalcQuoteTotals(item.quoteId);
  await logActivity({
    entityType: "Quote",
    entityId: item.quoteId,
    action: "UPDATED",
    summary: `Removed line item: ${item.description}`,
  });
  revalidatePath(`/quotes/${item.quoteId}`);
}
