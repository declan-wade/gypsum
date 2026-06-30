import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/server";
import { getAuthUserOptions } from "@/lib/auth/users";
import { columns } from "@/app/tasks/columns";

export default async function Page() {
  const userId = await getCurrentUserId();

  const [tasks, authUsers] = await Promise.all([
    userId
      ? prisma.task.findMany({
          where: { assigneeId: userId },
          include: { project: true },
          orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    getAuthUserOptions(),
  ]);

  const data = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectName: task.project.name,
    assigneeName: task.assigneeId ? authUsers.nameById.get(task.assigneeId) ?? null : null,
    status: task.status,
    dueDate: task.dueDate,
  }));

  return (
    <PageLayout title="My Tasks">
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
