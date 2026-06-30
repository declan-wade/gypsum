import { prisma } from "@/lib/prisma";

// Flags sent / partially-paid invoices as OVERDUE once their due date has
// passed. SENT and PARTIAL both still have an outstanding balance (PAID is a
// separate status), so a status filter is enough — no column comparison needed.
// Idempotent: safe to run on page load or from the cron route.
export async function markOverdueInvoices(): Promise<number> {
  const { count } = await prisma.invoice.updateMany({
    where: {
      status: { in: ["SENT", "PARTIAL"] },
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });
  return count;
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

const BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "Current", min: -Infinity, max: 0 },
  { label: "1–30 days", min: 1, max: 30 },
  { label: "31–60 days", min: 31, max: 60 },
  { label: "61–90 days", min: 61, max: 90 },
  { label: "90+ days", min: 91, max: Infinity },
];

const DAY_MS = 86_400_000;

// Outstanding receivables bucketed by how far past due each invoice is.
export async function getArAging(): Promise<AgingBucket[]> {
  const invoices = await prisma.invoice.findMany({
    where: { status: { notIn: ["PAID", "VOID"] } },
    select: { total: true, amountPaid: true, dueDate: true },
  });

  const now = Date.now();
  const result: AgingBucket[] = BUCKETS.map((b) => ({ label: b.label, amount: 0, count: 0 }));

  for (const inv of invoices) {
    const balance = Number(inv.total) - Number(inv.amountPaid);
    if (balance <= 0) continue;

    const daysOverdue = inv.dueDate
      ? Math.floor((now - new Date(inv.dueDate).getTime()) / DAY_MS)
      : 0;

    const idx = BUCKETS.findIndex((b) => daysOverdue >= b.min && daysOverdue <= b.max);
    const bucket = result[idx === -1 ? 0 : idx];
    bucket.amount += balance;
    bucket.count += 1;
  }

  for (const b of result) b.amount = Math.round(b.amount * 100) / 100;
  return result;
}
