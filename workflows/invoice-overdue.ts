import { sleep } from "workflow";
import { prisma } from "@/lib/prisma";
import { notifyInvoicesOverdue } from "@/lib/email";
import { formatMoney } from "@/lib/format";

const REMINDER_INTERVAL = "7d";
const MAX_REMINDERS = 4;

// One instance of this workflow runs per invoice from the moment it's sent.
// It sleeps until the due date, flags the invoice OVERDUE if it's still
// unpaid, then sends a reminder digest every 7 days (up to MAX_REMINDERS)
// until the invoice is paid, voided, or manually resolved. Replaces the old
// mark-overdue cron sweep with a per-invoice timer that needs no polling.
export async function trackInvoiceOverdue(invoiceId: string) {
  "use workflow";

  const initial = await getInvoiceState(invoiceId);
  if (!initial || !initial.dueDate || initial.status !== "SENT") {
    return { invoiceId, outcome: "skipped" as const };
  }

  const wait = initial.dueDate.getTime() - Date.now();
  if (wait > 0) {
    await sleep(wait);
  }

  const atDueDate = await getInvoiceState(invoiceId);
  if (!atDueDate || !["SENT", "PARTIAL"].includes(atDueDate.status)) {
    return { invoiceId, outcome: "resolved-before-due" as const };
  }

  await markOverdueAndNotify(invoiceId);

  for (let reminder = 1; reminder <= MAX_REMINDERS; reminder++) {
    await sleep(REMINDER_INTERVAL);

    const state = await getInvoiceState(invoiceId);
    if (!state || !["OVERDUE", "PARTIAL"].includes(state.status)) {
      return { invoiceId, outcome: "paid" as const, reminder };
    }

    await sendOverdueReminder(invoiceId);
  }

  return { invoiceId, outcome: "reminders-exhausted" as const };
}

async function getInvoiceState(invoiceId: string) {
  "use step";
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true, dueDate: true },
  });
}

async function markOverdueAndNotify(invoiceId: string) {
  "use step";
  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "OVERDUE" },
    select: { number: true, total: true, company: { select: { name: true } } },
  });

  await notifyInvoicesOverdue([
    {
      number: invoice.number,
      companyName: invoice.company.name,
      total: formatMoney(invoice.total.toString()),
    },
  ]);
}

async function sendOverdueReminder(invoiceId: string) {
  "use step";
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      number: true,
      total: true,
      amountPaid: true,
      company: { select: { name: true } },
    },
  });
  if (!invoice) return;

  const balance = Number(invoice.total) - Number(invoice.amountPaid);
  await notifyInvoicesOverdue([
    {
      number: invoice.number,
      companyName: invoice.company.name,
      total: formatMoney(balance.toString()),
    },
  ]);
}
