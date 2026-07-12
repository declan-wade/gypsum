import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  Building2Icon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  FileTextIcon,
} from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { RecordSection } from "@/components/record-section";
import { StatStrip, type StatStripItem } from "@/components/stat-strip";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  const isOverdue = invoice.status === "OVERDUE";

  const stats: StatStripItem[] = [
    { label: "Subtotal", value: formatMoney(Number(invoice.subtotal)) },
    { label: "Tax", value: formatMoney(Number(invoice.taxAmount)) },
    { label: "Total", value: formatMoney(Number(invoice.total)) },
    { label: "Paid", value: formatMoney(Number(invoice.amountPaid)) },
    {
      label: "Balance due",
      value: formatMoney(balanceDue),
      className:
        balanceDue > 0
          ? isOverdue
            ? "text-red-600 dark:text-red-400"
            : "text-amber-600 dark:text-amber-400"
          : undefined,
    },
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
      {/* identity header */}
      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
          <FileTextIcon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {invoice.number}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link
              href={`/companies/${invoice.companyId}`}
              className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline"
            >
              <Building2Icon className="size-3.5 opacity-70" />
              {invoice.company.name}
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="size-3.5 opacity-70" />
              Issued {formatDate(invoice.issueDate)}
            </span>
            {invoice.dueDate && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5",
                  isOverdue && "font-medium text-red-600 dark:text-red-400"
                )}
              >
                <ClockIcon className="size-3.5 opacity-70" />
                Due {formatDate(invoice.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <StatStrip stats={stats} />

      <RecordSection
        title="Line Items"
        count={lineItems.length}
        action={
          <ModalButton label="Add Line Item" title="Add Line Item">
            <AddLineItemForm invoiceId={invoice.id} products={productOptions} />
          </ModalButton>
        }
      >
        <LineItemsTable data={lineItems} products={productOptions} />
      </RecordSection>

      <RecordSection
        title="Payments"
        count={payments.length}
        action={
          <ModalButton label="Add Payment" title="Add Payment">
            <PaymentForm invoiceId={invoice.id} />
          </ModalButton>
        }
      >
        <DataTable columns={paymentColumns} data={payments} />
      </RecordSection>
    </PageLayout>
  );
}
