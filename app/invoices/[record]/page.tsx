import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { columns } from "./columns";
import { AddLineItemForm } from "./forms";

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>;
}) {
  const { record } = await params;

  const [invoice, products] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: record },
      include: {
        company: true,
        lineItems: { include: { product: true }, orderBy: { position: "asc" } },
      },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, description: true, unitPrice: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!invoice) {
    notFound();
  }

  const lineItems = invoice.lineItems.map((item) => ({
    id: item.id,
    description: item.description,
    productName: item.product?.name ?? null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal),
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
    description: p.description ?? "",
    unitPrice: Number(p.unitPrice),
  }));

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Status", value: <StatusBadge status={invoice.status} /> },
    {
      label: "Company",
      value: (
        <Link
          href={`/companies/${invoice.companyId}`}
          className="text-primary underline underline-offset-4"
        >
          {invoice.company.name}
        </Link>
      ),
    },
    { label: "Issued", value: formatDate(invoice.issueDate) },
    { label: "Due", value: formatDate(invoice.dueDate) },
    { label: "Subtotal", value: formatMoney(Number(invoice.subtotal)) },
    { label: "Tax", value: formatMoney(Number(invoice.taxAmount)) },
    { label: "Total", value: formatMoney(Number(invoice.total)) },
    { label: "Paid", value: formatMoney(Number(invoice.amountPaid)) },
  ];

  return (
    <PageLayout
      title={`Invoice ${invoice.number}`}
      actions={
        <Button variant="outline" nativeButton={false} render={<Link href="/invoices" />}>
          <ArrowLeftIcon />
          Back
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {details.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {detail.label}
              </span>
              <span className="text-sm">{detail.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Line Items ({lineItems.length})</h2>
          <ModalButton label="Add Line Item" title="Add Line Item">
            <AddLineItemForm invoiceId={invoice.id} products={productOptions} />
          </ModalButton>
        </div>
        <DataTable columns={columns} data={lineItems} />
      </div>
    </PageLayout>
  );
}
