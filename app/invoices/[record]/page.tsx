import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon, FileTextIcon } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ActivityDrawer } from "@/components/activity-drawer";
import { getActivities } from "@/lib/activity";
import { LineItemsTable } from "./line-items-table";
import { paymentColumns } from "./payment-columns";
import { AddLineItemForm } from "./forms";
import { PaymentForm } from "./payment-form";
import { InvoiceForm } from "@/app/invoices/forms";

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>;
}) {
  const { record } = await params;

  const [invoice, products, activities] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: record },
      include: {
        company: true,
        lineItems: { include: { product: true }, orderBy: { position: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, description: true, unitPrice: true },
      orderBy: { name: "asc" },
    }),
    getActivities("Invoice", record),
  ]);

  if (!invoice) {
    notFound();
  }

  const lineItems = invoice.lineItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    description: item.description,
    productName: item.product?.name ?? null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    lineTotal: Number(item.lineTotal),
    taxable: item.taxable,
  }));

  const productOptions = products.map((p) => ({
    value: p.id,
    label: p.name,
    description: p.description ?? "",
    unitPrice: Number(p.unitPrice),
  }));

  const payments = invoice.payments.map((payment) => ({
    id: payment.id,
    paidAt: payment.paidAt,
    amount: Number(payment.amount),
    method: payment.method,
    reference: payment.reference,
  }));

  const balanceDue = Number(invoice.total) - Number(invoice.amountPaid);

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
    { label: "Balance Due", value: formatMoney(balanceDue) },
  ];

  return (
    <PageLayout
      title={`Invoice ${invoice.number}`}
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/invoices" />}>
            <ArrowLeftIcon />
            Back
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <FileTextIcon />
            PDF
          </Button>
          <ModalButton label="Edit" icon={<PencilIcon />} variant="outline" title="Edit Invoice">
            <InvoiceForm
              record={{
                id: invoice.id,
                number: invoice.number,
                status: invoice.status,
                companyId: invoice.companyId,
                dueDate: invoice.dueDate,
                notes: invoice.notes,
              }}
            />
          </ModalButton>
          <ActivityDrawer activities={activities} />
        </>
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
        <h2 className="text-sm font-medium">Line Items ({lineItems.length})</h2>
        <LineItemsTable
          data={lineItems}
          products={productOptions}
          action={
            <ModalButton label="Add Line Item" title="Add Line Item">
              <AddLineItemForm invoiceId={invoice.id} products={productOptions} />
            </ModalButton>
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Payments ({payments.length})</h2>
        <DataTable
          columns={paymentColumns}
          data={payments}
          action={
            <ModalButton label="Add Payment" title="Add Payment">
              <PaymentForm invoiceId={invoice.id} />
            </ModalButton>
          }
        />
      </div>
    </PageLayout>
  );
}
