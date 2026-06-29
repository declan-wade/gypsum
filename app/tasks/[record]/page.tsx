import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import {
  columns as timeEntryColumns,
  type TimeEntryRow,
} from "@/app/time-tracking/columns";
import { TimeEntryForm } from "@/app/time-tracking/forms";
import { TaskForm } from "@/app/tasks/forms";
import { ActivityDrawer } from "@/components/activity-drawer";
import { getActivities } from "@/lib/activity";

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>;
}) {
  const { record } = await params;

  const [task, users, activities] = await Promise.all([
    prisma.task.findUnique({
      where: { id: record },
      include: {
        project: true,
        timeEntries: { include: { user: true }, orderBy: { date: "desc" } },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getActivities("Task", record),
  ]);

  if (!task) {
    notFound();
  }

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

  const timeEntryRows: TimeEntryRow[] = task.timeEntries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    userId: entry.userId,
    userName: entry.user.name,
    projectId: entry.projectId,
    projectName: task.project.name,
    taskId: entry.taskId,
    durationMinutes: entry.durationMinutes,
    billable: entry.billable,
    description: entry.description,
  }));

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Status", value: <StatusBadge status={task.status} /> },
    {
      label: "Project",
      value: (
        <Link
          href={`/projects/${task.projectId}`}
          className="text-primary underline underline-offset-4"
        >
          {task.project.name}
        </Link>
      ),
    },
    { label: "Due", value: formatDate(task.dueDate) },
  ];

  return (
    <PageLayout
      title={task.title}
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/tasks" />}>
            <ArrowLeftIcon />
            Back
          </Button>
          <ModalButton label="Edit" icon={<PencilIcon />} variant="outline" title="Edit Task">
            <TaskForm
              record={{
                id: task.id,
                title: task.title,
                projectId: task.projectId,
                status: task.status,
                dueDate: task.dueDate,
                description: task.description,
              }}
            />
          </ModalButton>
          <ActivityDrawer activities={activities} />
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                {detail.label}
              </span>
              <span className="text-sm">{detail.value}</span>
            </div>
          ))}
          {task.description && (
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <span className="text-sm">{task.description}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Time Entries ({timeEntryRows.length})</h2>
          <ModalButton label="Add Time Entry" title="Add Time Entry">
            <TimeEntryForm users={userOptions} projectId={task.projectId} taskId={task.id} />
          </ModalButton>
        </div>
        <DataTable columns={timeEntryColumns} data={timeEntryRows} />
      </div>
    </PageLayout>
  );
}
