import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { listAuthUsers } from "@/lib/auth/users";
import { columns } from "./columns";
import { AuthUserForm } from "./forms";

export default async function Page() {
  const data = await listAuthUsers();

  return (
    <PageLayout
      title="Users"
      actions={
        <ModalButton label="Add User" title="Add User">
          <AuthUserForm />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
