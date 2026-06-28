import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { DealForm } from "./forms";

export default async function Page() {
  const [deals, companies] = await Promise.all([
    prisma.deal.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    stage: deal.stage,
    companyName: deal.company.name,
    expectedCloseDate: deal.expectedCloseDate,
  }));

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <PageLayout
      title="Deals"
      actions={
        <ModalButton label="Add Deal" title="Add Deal">
          <DealForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
