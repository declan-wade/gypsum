import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { prisma } from "@/lib/prisma";
import { columns } from "./columns";
import { TimeEntryForm } from "./forms";

export default async function Page() {
  const [entries, users, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      include: { user: true, project: true },
      orderBy: { date: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const data = entries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    userName: entry.user.name,
    projectName: entry.project.name,
    durationMinutes: entry.durationMinutes,
    billable: entry.billable,
    description: entry.description,
  }));

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));
  const projectOptions = projects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <PageLayout
      title="Time Tracking"
      actions={
        <ModalButton label="Add Time Entry" title="Add Time Entry">
          <TimeEntryForm users={userOptions} projects={projectOptions} />
        </ModalButton>
      }
    >
      <DataTable columns={columns} data={data} />
    </PageLayout>
  );
}
