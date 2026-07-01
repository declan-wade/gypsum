import { PageLayout } from "@/components/page-layout";
import { ModalButton } from "@/components/modal";
import { listAuthUsers } from "@/lib/auth/users";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "./users-table";
import { AuthUserForm } from "./forms";

export default async function Page() {
  const [data, companies] = await Promise.all([
    listAuthUsers(),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  return (
    <PageLayout
      title="Users"
      actions={
        <ModalButton label="Add User" title="Add User">
          <AuthUserForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <UsersTable data={data} companies={companyOptions} />
    </PageLayout>
  );
}
