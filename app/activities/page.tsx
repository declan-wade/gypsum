import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { getRecentActivities } from "@/lib/activity";
import { columns } from "./columns";

export default async function Page() {
  const data = await getRecentActivities(100);

  return (
    <PageLayout title="Activity">
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
