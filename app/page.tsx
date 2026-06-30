import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { getArAging } from "@/lib/invoice-ar";

export default async function Page() {
  const [
    companies,
    contacts,
    openDeals,
    pipeline,
    invoiceTotals,
    activeProjects,
    openTasks,
    aging,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.contact.count(),
    prisma.deal.count({ where: { stage: { notIn: ["WON", "LOST"] } } }),
    prisma.deal.aggregate({
      _sum: { value: true },
      where: { stage: { notIn: ["WON", "LOST"] } },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true, amountPaid: true },
      where: { status: { notIn: ["PAID", "VOID"] } },
    }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.task.count({ where: { status: { not: "DONE" } } }),
    getArAging(),
  ]);

  const pipelineValue = Number(pipeline._sum.value ?? 0);
  const outstanding =
    Number(invoiceTotals._sum.total ?? 0) -
    Number(invoiceTotals._sum.amountPaid ?? 0);

  const stats: { label: string; value: string | number }[] = [
    { label: "Companies", value: companies },
    { label: "Contacts", value: contacts },
    { label: "Open Deals", value: openDeals },
    { label: "Pipeline Value", value: formatMoney(pipelineValue) },
    { label: "Outstanding Invoices", value: formatMoney(outstanding) },
    { label: "Active Projects", value: activeProjects },
    { label: "Open Tasks", value: openTasks },
  ];

  const totalOutstanding = aging.reduce((sum, b) => sum + b.amount, 0);

  return (
    <PageLayout title="Dashboard">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Accounts Receivable — Aging</h2>
          <span className="text-sm text-muted-foreground">
            {formatMoney(totalOutstanding)} outstanding
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {aging.map((bucket) => (
            <Card key={bucket.label}>
              <CardContent className="flex flex-col gap-1">
                <span className="text-sm text-muted-foreground">{bucket.label}</span>
                <span className="text-3xl font-bold tracking-tight">
                  {formatMoney(bucket.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {bucket.count} invoice{bucket.count === 1 ? "" : "s"}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
