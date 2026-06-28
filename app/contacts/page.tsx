import { PageLayout } from "@/components/page-layout"
import { DataTable } from "@/components/data-table"
import { ModalButton } from "@/components/modal"
import { prisma } from "@/lib/prisma"
import { columns } from "./columns"
import { ContactForm } from "./forms"

export default async function Page() {
  const [data, companies] = await Promise.all([
    prisma.contact.findMany({ include: { company: true } }),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }))

  return (
    <PageLayout
      title="Contacts"
      actions={
        <ModalButton label="Add Contact" title="Add Contact">
          <ContactForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  )
}
