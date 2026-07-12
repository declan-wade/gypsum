import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { getAuthUserOptions } from "@/lib/auth/users";
import { getCurrentUserId } from "@/lib/auth/server";
import { columns } from "./columns";
import { TimeEntryForm } from "./forms";

export default async function Page() {
  const [entries, { options: userOptions, nameById }, projects, currentUserId] =
    await Promise.all([
      prisma.timeEntry.findMany({
        include: { project: true },
        orderBy: { date: "desc" },
      }),
      getAuthUserOptions(),
      prisma.project.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      getCurrentUserId(),
    ]);

  const data = entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    userId: entry.userId,
    userName: nameById.get(entry.userId) ?? "Unknown",
    projectId: entry.projectId,
    projectName: entry.project.name,
    taskId: entry.taskId,
    durationMinutes: entry.durationMinutes,
    billable: entry.billable,
    description: entry.description,
  }));

  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <PageLayout
      title="Time Tracking"
      actions={
        <ModalButton label="Add Time Entry" title="Add Time Entry">
          <TimeEntryForm users={userOptions} projects={projectOptions} currentUserId={currentUserId ?? undefined} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
