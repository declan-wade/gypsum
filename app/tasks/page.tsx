import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { getAuthUserOptions } from "@/lib/auth/users";
import { columns } from "./columns";
import { TaskForm } from "./forms";

export default async function Page() {
  const [tasks, projects, authUsers] = await Promise.all([
    prisma.task.findMany({
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
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

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <PageLayout
      title="Tasks"
      actions={
        <ModalButton label="Add Task" title="Add Task">
          <TaskForm projects={projectOptions} assignees={authUsers.options} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
