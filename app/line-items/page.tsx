import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { LineItemForm } from "./forms";

export default async function Page() {
  const [lineItems, invoices] = await Promise.all([
    prisma.invoiceLineItem.findMany({
      include: { invoice: true },
      orderBy: { position: "asc" },
    }),
    prisma.invoice.findMany({
      select: { id: true, number: true },
      orderBy: { number: "asc" },
    }),
  ]);

  const data = lineItems.map((item) => ({
    id: item.id,
    invoiceNumber: item.invoice.number,
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal),
  }));

  const invoiceOptions = invoices.map((i) => ({ value: i.id, label: i.number }));

  return (
    <PageLayout
      title="Line Items"
      actions={
        <ModalButton label="Add Line Item" title="Add Line Item">
          <LineItemForm invoices={invoiceOptions} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
