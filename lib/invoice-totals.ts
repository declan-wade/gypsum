import { prisma } from "@/lib/prisma";

// Australian GST, fixed at 10%, applied per line item when `taxable` is true.
export const GST_RATE = 0.1;

const round2 = (n: number) => Math.round(n * 100) / 100;

// Recomputes an invoice's denormalised totals from its current line items.
export async function recalcInvoiceTotals(invoiceId: string) {
  const items = await prisma.invoiceLineItem.findMany({
    where: { invoiceId },
    select: { lineTotal: true, taxable: true },
  });

  let subtotal = 0;
  let taxAmount = 0;
  for (const item of items) {
    const lineTotal = Number(item.lineTotal);
    subtotal += lineTotal;
    if (item.taxable) {
      taxAmount += lineTotal * GST_RATE;
    }
  }

  subtotal = round2(subtotal);
  taxAmount = round2(taxAmount);

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { subtotal, taxAmount, total: round2(subtotal + taxAmount) },
  });
}
