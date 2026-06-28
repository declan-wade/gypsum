import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { CompanyForm } from "./forms";

export default async function Page() {
  const data = await prisma.company.findMany({});

  return (
    <PageLayout
      title="Companies"
      actions={
        <ModalButton label="Add Company" title="Add Company">
          <CompanyForm />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
