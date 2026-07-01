import { PageLayout } from "@/components/page-layout";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { DealForm } from "./forms";
import { DealsView } from "./deals-view";

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
    companyId: deal.companyId,
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
      <DealsView data={data} />
    </PageLayout>
  );
}
