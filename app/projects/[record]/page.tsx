import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, PencilIcon } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { ModalButton } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import {
  columns as timeEntryColumns,
  type TimeEntryRow,
} from "@/app/time-tracking/columns";
import { columns as taskColumns, type TaskRow } from "@/app/tasks/columns";
import { TaskForm } from "@/app/tasks/forms";
import { getAuthUserOptions } from "@/lib/auth/users";
import { getCurrentUserId } from "@/lib/auth/server";
import { TimeEntryForm } from "@/app/time-tracking/forms";
import { ProjectForm } from "@/app/projects/forms";
import { StatusBadge } from "@/components/status-badge";
import { ActivityDrawer } from "@/components/activity-drawer";
import { getActivities } from "@/lib/activity";

function RelatedSection<T>({
  title,
  columns,
  data,
  action,
}: {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  data: T[];
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">
        {title} ({data.length})
      </h2>
      <DataTable columns={columns} data={data} action={action} />
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>;
}) {
  const { record } = await params;

  const [project, authUsers, currentUserId, activities] = await Promise.all([
    prisma.project.findUnique({
      where: { id: record },
      include: {
        company: true,
        tasks: { orderBy: { createdAt: "desc" } },
        timeEntries: { orderBy: { date: "desc" } },
      },
    }),
    getAuthUserOptions(),
    getCurrentUserId(),
    getActivities("Project", record),
  ]);

  if (!project) {
    notFound();
  }

  const userOptions = authUsers.options;

  const taskRows: TaskRow[] = project.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectName: project.name,
    assigneeName: task.assigneeId ? authUsers.nameById.get(task.assigneeId) ?? null : null,
    status: task.status,
    dueDate: task.dueDate,
  }));

  const timeEntryRows: TimeEntryRow[] = project.timeEntries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    userId: entry.userId,
    userName: authUsers.nameById.get(entry.userId) ?? "Unknown",
    projectId: entry.projectId,
    projectName: project.name,
    taskId: entry.taskId,
    durationMinutes: entry.durationMinutes,
    billable: entry.billable,
    description: entry.description,
  }));

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Status", value: <StatusBadge status={project.status} /> },
    {
      label: "Company",
      value: (
        <Link
          href={`/companies/${project.companyId}`}
          className="text-primary underline underline-offset-4"
        >
          {project.company.name}
        </Link>
      ),
    },
    {
      label: "Hourly Rate",
      value: project.hourlyRate === null ? "—" : formatMoney(Number(project.hourlyRate)),
    },
    {
      label: "Budget",
      value: project.budget === null ? "—" : formatMoney(Number(project.budget)),
    },
    { label: "Start", value: formatDate(project.startDate) },
    { label: "End", value: formatDate(project.endDate) },
  ];

  return (
    <PageLayout
      title={project.name}
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/projects" />}>
            <ArrowLeftIcon />
            Back
          </Button>
          <ModalButton label="Edit" icon={<PencilIcon />} variant="outline" title="Edit Project">
            <ProjectForm
              record={{
                id: project.id,
                name: project.name,
                companyId: project.companyId,
                status: project.status,
                hourlyRate: project.hourlyRate === null ? null : Number(project.hourlyRate),
                budget: project.budget === null ? null : Number(project.budget),
                startDate: project.startDate,
                endDate: project.endDate,
                description: project.description,
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
          {project.description && (
            <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <span className="text-sm">{project.description}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <RelatedSection
        title="Tasks"
        columns={taskColumns}
        data={taskRows}
        action={
          <ModalButton label="Add Task" title="Add Task">
            <TaskForm projectId={project.id} assignees={authUsers.options} />
          </ModalButton>
        }
      />
      <RelatedSection
        title="Time Entries"
        columns={timeEntryColumns}
        data={timeEntryRows}
        action={
          <ModalButton label="Add Time Entry" title="Add Time Entry">
            <TimeEntryForm users={userOptions} projectId={project.id} currentUserId={currentUserId ?? undefined} />
          </ModalButton>
        }
      />
    </PageLayout>
  );
}
