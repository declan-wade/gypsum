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

// Recomputes amountPaid from payments and derives PAID / PARTIAL status.
// Leaves a VOID invoice untouched, and only auto-advances status (it won't
// pull an unpaid invoice back from a manually-set OVERDUE etc.).
export async function recalcInvoicePayments(invoiceId: string) {
  const [payments, invoice] = await Promise.all([
    prisma.payment.findMany({ where: { invoiceId }, select: { amount: true } }),
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { total: true, status: true, dueDate: true },
    }),
  ]);
  if (!invoice) return;

  const amountPaid = round2(payments.reduce((sum, p) => sum + Number(p.amount), 0));
  const total = Number(invoice.total);
  const pastDue = invoice.dueDate ? new Date(invoice.dueDate).getTime() < Date.now() : false;

  let status = invoice.status;
  if (status !== "VOID") {
    if (total > 0 && amountPaid >= total) {
      status = "PAID";
    } else if (amountPaid > 0) {
      // A partially-paid invoice that's past due stays OVERDUE.
      status = pastDue ? "OVERDUE" : "PARTIAL";
    }
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { amountPaid, status },
  });
}
