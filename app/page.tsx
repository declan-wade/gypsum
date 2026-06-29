import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";

export default async function Page() {
  const [
    companies,
    contacts,
    openDeals,
    pipeline,
    invoiceTotals,
    activeProjects,
    openTasks,
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
    </PageLayout>
  );
}
