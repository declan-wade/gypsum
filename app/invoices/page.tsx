import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { StatStrip, type StatStripItem } from "@/components/stat-strip";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { markOverdueInvoices } from "@/lib/invoice-ar";
import { columns } from "./columns";
import { InvoiceForm } from "./forms";

export default async function Page() {
  // Keep statuses current on view; the daily cron is the scheduled backstop.
  await markOverdueInvoices();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);

  const [invoices, companies, outstandingTotals, overdue, dueSoonCount, paidThisMonth] =
    await Promise.all([
      prisma.invoice.findMany({
        include: { company: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true, amountPaid: true },
        where: { status: { notIn: ["PAID", "VOID"] } },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true, amountPaid: true },
        _count: true,
        where: { status: "OVERDUE" },
      }),
      prisma.invoice.count({
        where: {
          status: { in: ["SENT", "PARTIAL"] },
          dueDate: { gte: now, lte: weekAhead },
        },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paidAt: { gte: monthStart } },
      }),
    ]);

  const data = invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    companyName: invoice.company.name,
    status: invoice.status,
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    dueDate: invoice.dueDate,
  }));

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const outstanding =
    Number(outstandingTotals._sum.total ?? 0) -
    Number(outstandingTotals._sum.amountPaid ?? 0);
  const overdueAmount =
    Number(overdue._sum.total ?? 0) - Number(overdue._sum.amountPaid ?? 0);

  const stats: StatStripItem[] = [
    { label: "Outstanding", value: formatMoney(outstanding) },
    {
      label: `Overdue · ${overdue._count}`,
      value: formatMoney(overdueAmount),
      className:
        overdue._count > 0 ? "text-red-600 dark:text-red-400" : undefined,
    },
    { label: "Due in next 7 days", value: dueSoonCount },
    {
      label: "Collected this month",
      value: formatMoney(Number(paidThisMonth._sum.amount ?? 0)),
    },
  ];

  return (
    <PageLayout
      title="Invoices"
      actions={
        <ModalButton label="Add Invoice" title="Add Invoice">
          <InvoiceForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <StatStrip stats={stats} />
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
