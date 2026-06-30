import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { markOverdueInvoices } from "@/lib/invoice-ar";
import { columns } from "./columns";
import { InvoiceForm } from "./forms";

export default async function Page() {
  // Keep statuses current on view; the daily cron is the scheduled backstop.
  await markOverdueInvoices();

  const [invoices, companies] = await Promise.all([
    prisma.invoice.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
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

  return (
    <PageLayout
      title="Invoices"
      actions={
        <ModalButton label="Add Invoice" title="Add Invoice">
          <InvoiceForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
