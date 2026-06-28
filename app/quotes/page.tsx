import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { QuoteForm } from "./forms";

export default async function Page() {
  const [quotes, companies] = await Promise.all([
    prisma.quote.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = quotes.map((quote) => ({
    id: quote.id,
    number: quote.number,
    companyName: quote.company.name,
    status: quote.status,
    total: Number(quote.total),
    issueDate: quote.issueDate,
    expiryDate: quote.expiryDate,
  }));

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <PageLayout
      title="Quotes"
      actions={
        <ModalButton label="Add Quote" title="Add Quote">
          <QuoteForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
