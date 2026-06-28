import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { ModalButton } from "@/components/modal"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { columns as contactColumns } from "@/app/contacts/columns"
import { ContactForm } from "@/app/contacts/forms"
import { columns as dealColumns, type DealRow } from "@/app/deals/columns"
import { DealForm } from "@/app/deals/forms"
import { columns as quoteColumns, type QuoteRow } from "@/app/quotes/columns"
import { QuoteForm } from "@/app/quotes/forms"
import { columns as invoiceColumns, type InvoiceRow } from "@/app/invoices/columns"
import { InvoiceForm } from "@/app/invoices/forms"
import { columns as userColumns, type UserRow } from "@/app/users/columns"
import { columns as projectColumns, type ProjectRow } from "@/app/projects/columns"
import { ProjectForm } from "@/app/projects/forms"
import { StatusBadge } from "@/components/status-badge"

// Renders a titled related-records sub-table. Generic so each section keeps the
// row typing from the entity's own column definitions.
function RelatedSection<T>({
  title,
  columns,
  data,
  action,
}: {
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[]
  data: T[]
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {title} ({data.length})
        </h2>
        {action}
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  )
}

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>
}) {
  const { record } = await params

  const [company, users] = await Promise.all([
    prisma.company.findUnique({
      where: { id: record },
      include: {
        contacts: true,
        deals: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        projects: { orderBy: { createdAt: "desc" } },
      },
    }),
    // Users connected to this company: its owner plus the owners of any of its
    // deals, quotes, or invoices (deduplicated by the query).
    prisma.user.findMany({
      where: {
        OR: [
          { ownedCompanies: { some: { id: record } } },
          { ownedDeals: { some: { companyId: record } } },
          { quotes: { some: { companyId: record } } },
          { invoices: { some: { companyId: record } } },
        ],
      },
      orderBy: { name: "asc" },
    }),
  ])

  if (!company) {
    notFound()
  }

  const dealRows: DealRow[] = company.deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    stage: deal.stage,
    companyName: company.name,
    expectedCloseDate: deal.expectedCloseDate,
  }))

  const quoteRows: QuoteRow[] = company.quotes.map((quote) => ({
    id: quote.id,
    number: quote.number,
    companyName: company.name,
    status: quote.status,
    total: Number(quote.total),
    issueDate: quote.issueDate,
    expiryDate: quote.expiryDate,
  }))

  const invoiceRows: InvoiceRow[] = company.invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    companyName: company.name,
    status: invoice.status,
    total: Number(invoice.total),
    amountPaid: Number(invoice.amountPaid),
    dueDate: invoice.dueDate,
  }))

  const userRows: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  }))

  const projectRows: ProjectRow[] = company.projects.map((project) => ({
    id: project.id,
    name: project.name,
    companyName: company.name,
    status: project.status,
    budget: project.budget === null ? null : Number(project.budget),
    startDate: project.startDate,
    endDate: project.endDate,
  }))

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Status", value: <StatusBadge status={company.status} /> },
    { label: "Industry", value: company.industry ?? "—" },
    {
      label: "Website",
      value: company.website ? (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-4"
        >
          {company.website}
        </a>
      ) : (
        "—"
      ),
    },
    { label: "Email", value: company.email ?? "—" },
    { label: "Phone", value: company.phone ?? "—" },
  ]

  return (
    <PageLayout
      title={company.name}
      actions={
        <Button variant="outline" nativeButton={false} render={<Link href="/companies" />}>
          <ArrowLeftIcon />
          Back
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <RelatedSection
        title="Contacts"
        columns={contactColumns}
        data={company.contacts}
        action={
          <ModalButton label="Add Contact" title="Add Contact">
            <ContactForm companyId={company.id} />
          </ModalButton>
        }
      />
      <RelatedSection
        title="Projects"
        columns={projectColumns}
        data={projectRows}
        action={
          <ModalButton label="Add Project" title="Add Project">
            <ProjectForm companyId={company.id} />
          </ModalButton>
        }
      />
      <RelatedSection
        title="Deals"
        columns={dealColumns}
        data={dealRows}
        action={
          <ModalButton label="Add Deal" title="Add Deal">
            <DealForm companyId={company.id} />
          </ModalButton>
        }
      />
      <RelatedSection
        title="Quotes"
        columns={quoteColumns}
        data={quoteRows}
        action={
          <ModalButton label="Add Quote" title="Add Quote">
            <QuoteForm companyId={company.id} />
          </ModalButton>
        }
      />
      <RelatedSection
        title="Invoices"
        columns={invoiceColumns}
        data={invoiceRows}
        action={
          <ModalButton label="Add Invoice" title="Add Invoice">
            <InvoiceForm companyId={company.id} />
          </ModalButton>
        }
      />
      <RelatedSection title="Users" columns={userColumns} data={userRows} />
    </PageLayout>
  )
}
