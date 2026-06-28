import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { UserForm } from "./forms";

export default async function Page() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });

  const data = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  }));

  return (
    <PageLayout
      title="Users"
      actions={
        <ModalButton label="Add User" title="Add User">
          <UserForm />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
