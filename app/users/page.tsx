import { PageLayout } from "@/components/page-layout";
import { ModalButton } from "@/components/modal";
import { listAuthUsers } from "@/lib/auth/users";
import { prisma } from "@/lib/prisma";
import { getGrantedModulesByUser } from "@/lib/rbac";
import { UsersTable } from "./users-table";
import { AuthUserForm } from "./forms";

export default async function Page() {
  const [data, companies] = await Promise.all([
    listAuthUsers(),
    prisma.company.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const grantedMap = await getGrantedModulesByUser(data.map((u) => u.id));
  const modulesByUser = Object.fromEntries(grantedMap);

  return (
    <PageLayout
      title="Users"
      actions={
        <ModalButton label="Add User" title="Add User">
          <AuthUserForm companies={companyOptions} />
        </ModalButton>
      }
    >
      <UsersTable data={data} companies={companyOptions} modulesByUser={modulesByUser} />
    </PageLayout>
  );
}
