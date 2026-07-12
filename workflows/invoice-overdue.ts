import { sleep } from "workflow";
import { prisma } from "@/lib/prisma";
import { notifyInvoicesOverdue } from "@/lib/email";
import { formatMoney } from "@/lib/format";
import { getWorkflowConfig } from "@/lib/workflow-config";

const DAY_MS = 86_400_000;

// One instance of this workflow runs per invoice from the moment it's sent.
// It sleeps until the due date, flags the invoice OVERDUE if it's still
// unpaid, then sends a reminder digest every `reminderIntervalDays` (up to
// `maxReminders`) until the invoice is paid, voided, or manually resolved.
// Interval/limit come from the "invoice-overdue" WorkflowConfig and are
// re-read before every reminder, so settings changes apply to in-flight runs.
export async function trackInvoiceOverdue(invoiceId: string) {
  "use workflow";

  const initial = await getInvoiceState(invoiceId);
  if (!initial.enabled) {
    return { invoiceId, outcome: "disabled" as const };
  }
  if (!initial.invoice || !initial.invoice.dueDate || initial.invoice.status !== "SENT") {
    return { invoiceId, outcome: "skipped" as const };
  }

  const wait = new Date(initial.invoice.dueDate).getTime() - Date.now();
  if (wait > 0) {
    await sleep(wait);
  }

  const atDueDate = await getInvoiceState(invoiceId);
  if (!atDueDate.invoice || !["SENT", "PARTIAL"].includes(atDueDate.invoice.status)) {
    return { invoiceId, outcome: "resolved-before-due" as const };
  }
  if (!atDueDate.enabled) {
    return { invoiceId, outcome: "disabled" as const };
  }

  await markOverdueAndNotify(invoiceId);

  for (let reminder = 1; ; reminder++) {
    const cfg = await getReminderConfig();
    if (!cfg.enabled || reminder > cfg.maxReminders) {
      return { invoiceId, outcome: "reminders-exhausted" as const, reminder };
    }

    await sleep(cfg.reminderIntervalDays * DAY_MS);

    const state = await getInvoiceState(invoiceId);
    if (!state.invoice || !["OVERDUE", "PARTIAL"].includes(state.invoice.status)) {
      return { invoiceId, outcome: "paid" as const, reminder };
    }
    if (!state.enabled) {
      return { invoiceId, outcome: "disabled" as const, reminder };
    }

    await sendOverdueReminder(invoiceId);
  }
}

async function getInvoiceState(invoiceId: string) {
  "use step";
  const [invoice, config] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { status: true, dueDate: true },
    }),
    getWorkflowConfig("invoice-overdue"),
  ]);
  return { invoice, enabled: config.enabled };
}

async function getReminderConfig() {
  "use step";
  const config = await getWorkflowConfig("invoice-overdue");
  return {
    enabled: config.enabled,
    reminderIntervalDays: Number(config.settings.reminderIntervalDays ?? 7),
    maxReminders: Number(config.settings.maxReminders ?? 4),
  };
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
