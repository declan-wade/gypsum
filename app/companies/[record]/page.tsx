import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeftIcon,
  GlobeIcon,
  MailIcon,
  PackageIcon,
  PencilIcon,
  PhoneIcon,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { ModalButton } from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { formatMoney, formatRelativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { columns as contactColumns } from "@/app/contacts/columns"
import { ContactForm } from "@/app/contacts/forms"
import { CompanyForm } from "@/app/companies/forms"
import { columns as dealColumns, type DealRow } from "@/app/deals/columns"
import { DealForm } from "@/app/deals/forms"
import { columns as quoteColumns, type QuoteRow } from "@/app/quotes/columns"
import { QuoteForm } from "@/app/quotes/forms"
import { columns as invoiceColumns, type InvoiceRow } from "@/app/invoices/columns"
import { InvoiceForm } from "@/app/invoices/forms"
import { columns as projectColumns, type ProjectRow } from "@/app/projects/columns"
import { ProjectForm } from "@/app/projects/forms"
import { StatusBadge } from "@/components/status-badge"
import { ActivityDrawer } from "@/components/activity-drawer"
import { getActivities } from "@/lib/activity"

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("")
}

// Renders a related-records section as a card with a count pill and header
// action. Generic so each section keeps the row typing from the entity's own
// column definitions.
function RelatedSection<T>({
  id,
  title,
  columns,
  data,
  action,
}: {
  id: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[]
  data: T[]
  action?: React.ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-4 gap-3">
      <div className="flex items-center gap-2.5 border-b px-(--card-spacing) pb-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {data.length}
        </span>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      <div className="px-(--card-spacing)">
        <DataTable
          columns={columns}
          data={data}
          searchPlaceholder={`Search ${title.toLowerCase()}...`}
        />
      </div>
    </Card>
  )
}

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>
}) {
  const { record } = await params

  const [company, activities] = await Promise.all([
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
    getActivities("Company", record),
  ])

  if (!company) {
    notFound()
  }

  const dealRows: DealRow[] = company.deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    value: Number(deal.value),
    stage: deal.stage,
    companyId: deal.companyId,
    companyName: company.name,
    expectedCloseDate: deal.expectedCloseDate,
  }))

  const quoteRows: QuoteRow[] = company.quotes.map((quote) => ({
    id: quote.id,
    number: quote.number,
    companyId: quote.companyId,
    companyName: company.name,
    status: quote.status,
    total: Number(quote.total),
    issueDate: quote.issueDate,
    expiryDate: quote.expiryDate,
    notes: quote.notes,
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

  const projectRows: ProjectRow[] = company.projects.map((project) => ({
    id: project.id,
    name: project.name,
    companyName: company.name,
    status: project.status,
    budget: project.budget === null ? null : Number(project.budget),
    startDate: project.startDate,
    endDate: project.endDate,
  }))

  const lifetimeValue = company.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.amountPaid),
    0
  )
  const openDealValue = company.deals
    .filter((deal) => deal.stage !== "WON" && deal.stage !== "LOST")
    .reduce((sum, deal) => sum + Number(deal.value), 0)
  const outstanding = company.invoices
    .filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID")
    .reduce(
      (sum, invoice) => sum + Number(invoice.total) - Number(invoice.amountPaid),
      0
    )
  const activeProjects = company.projects.filter(
    (project) => project.status === "ACTIVE"
  ).length

  const stats: { label: string; value: string | number; className?: string }[] = [
    { label: "Lifetime value", value: formatMoney(lifetimeValue) },
    { label: "Open deal value", value: formatMoney(openDealValue) },
    {
      label: "Outstanding",
      value: formatMoney(outstanding),
      className:
        outstanding > 0 ? "text-amber-600 dark:text-amber-400" : undefined,
    },
    { label: "Active projects", value: activeProjects },
    {
      label: "Last activity",
      value: activities[0]
        ? formatRelativeTime(activities[0].createdAt)
        : "—",
    },
  ]

  const sections = [
    { id: "contacts", label: "Contacts", count: company.contacts.length },
    { id: "projects", label: "Projects", count: company.projects.length },
    { id: "deals", label: "Deals", count: company.deals.length },
    { id: "quotes", label: "Quotes", count: company.quotes.length },
    { id: "invoices", label: "Invoices", count: company.invoices.length },
  ]

  const meta: { icon: typeof GlobeIcon; node: React.ReactNode }[] = []
  if (company.industry) {
    meta.push({ icon: PackageIcon, node: company.industry })
  }
  if (company.website) {
    meta.push({
      icon: GlobeIcon,
      node: (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground hover:underline"
        >
          {company.website.replace(/^https?:\/\//, "")}
        </a>
      ),
    })
  }
  if (company.email) {
    meta.push({
      icon: MailIcon,
      node: (
        <a
          href={`mailto:${company.email}`}
          className="hover:text-foreground hover:underline"
        >
          {company.email}
        </a>
      ),
    })
  }
  if (company.phone) {
    meta.push({ icon: PhoneIcon, node: company.phone })
  }

  return (
    <PageLayout
      title={company.name}
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/companies" />}>
            <ArrowLeftIcon />
            Back
          </Button>
          <ModalButton
            label="Edit"
            icon={<PencilIcon />}
            variant="outline"
            title="Edit Company"
          >
            <CompanyForm
              record={{
                id: company.id,
                name: company.name,
                website: company.website ?? "",
                industry: company.industry ?? "",
                status: company.status,
              }}
            />
          </ModalButton>
          <ActivityDrawer activities={activities} />
        </>
      }
    >
      {/* identity header */}
      <div className="flex items-center gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-lg font-bold tracking-wide text-primary">
          {initials(company.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {company.name}
            </h1>
            <StatusBadge status={company.status} />
          </div>
          {meta.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {meta.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <item.icon className="size-3.5 opacity-70" />
                  {item.node}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* stat strip */}
      <Card className="py-0">
        <div className="grid grid-cols-2 divide-y sm:grid-cols-3 sm:divide-x lg:grid-cols-5 lg:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-5 py-3.5">
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div
                className={cn(
                  "mt-1 text-lg font-semibold tabular-nums",
                  stat.className
                )}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* section quick-nav */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
          >
            {section.label}
            <span className="rounded-full bg-muted px-1.5 py-px text-[10.5px] font-semibold">
              {section.count}
            </span>
          </a>
        ))}
      </div>

      <RelatedSection
        id="contacts"
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
        id="projects"
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
        id="deals"
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
        id="quotes"
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
        id="invoices"
        title="Invoices"
        columns={invoiceColumns}
        data={invoiceRows}
        action={
          <ModalButton label="Add Invoice" title="Add Invoice">
            <InvoiceForm companyId={company.id} />
          </ModalButton>
        }
      />
    </PageLayout>
  )
}
