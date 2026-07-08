import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon, FileTextIcon } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { ModalButton } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ActivityDrawer } from "@/components/activity-drawer";
import { getActivities } from "@/lib/activity";
import { LineItemsTable } from "./line-items-table";
import { AddLineItemForm } from "./forms";
import { QuoteForm } from "@/app/quotes/forms";

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>;
}) {
  const { record } = await params;

  const [quote, products, activities] = await Promise.all([
    prisma.quote.findUnique({
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
    getActivities("Quote", record),
  ]);

  if (!quote) {
    notFound();
  }

  const lineItems = quote.lineItems.map((item) => ({
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

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Status", value: <StatusBadge status={quote.status} /> },
    {
      label: "Company",
      value: (
        <Link
          href={`/companies/${quote.companyId}`}
          className="text-primary underline underline-offset-4"
        >
          {quote.company.name}
        </Link>
      ),
    },
    { label: "Issued", value: formatDate(quote.issueDate) },
    { label: "Expires", value: formatDate(quote.expiryDate) },
    { label: "Subtotal", value: formatMoney(Number(quote.subtotal)) },
    { label: "Tax", value: formatMoney(Number(quote.taxAmount)) },
    { label: "Total", value: formatMoney(Number(quote.total)) },
  ];

  return (
    <PageLayout
      title={`Quote ${quote.number}`}
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/quotes" />}>
            <ArrowLeftIcon />
            Back
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a
                href={`/api/quotes/${quote.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <FileTextIcon />
            PDF
          </Button>
          <ModalButton label="Edit" icon={<PencilIcon />} variant="outline" title="Edit Quote">
            <QuoteForm
              record={{
                id: quote.id,
                number: quote.number,
                status: quote.status,
                companyId: quote.companyId,
                expiryDate: quote.expiryDate,
                notes: quote.notes,
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
              <AddLineItemForm quoteId={quote.id} products={productOptions} />
            </ModalButton>
          }
        />
      </div>
    </PageLayout>
  );
}
