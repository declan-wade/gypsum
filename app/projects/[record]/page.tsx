import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
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
import { TimeEntryForm } from "@/app/time-tracking/forms";
import { StatusBadge } from "@/components/status-badge";

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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">
          {title} ({data.length})
        </h2>
        {action}
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ record: string }>;
}) {
  const { record } = await params;

  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id: record },
      include: {
        company: true,
        tasks: { orderBy: { createdAt: "desc" } },
        timeEntries: { include: { user: true }, orderBy: { date: "desc" } },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) {
    notFound();
  }

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

  const taskRows: TaskRow[] = project.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    projectName: project.name,
    status: task.status,
    dueDate: task.dueDate,
  }));

  const timeEntryRows: TimeEntryRow[] = project.timeEntries.map((entry) => ({
    id: entry.id,
    date: entry.date,
    userName: entry.user.name,
    projectName: project.name,
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
        <Button variant="outline" nativeButton={false} render={<Link href="/projects" />}>
          <ArrowLeftIcon />
          Back
        </Button>
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
            <TaskForm projectId={project.id} />
          </ModalButton>
        }
      />
      <RelatedSection
        title="Time Entries"
        columns={timeEntryColumns}
        data={timeEntryRows}
        action={
          <ModalButton label="Add Time Entry" title="Add Time Entry">
            <TimeEntryForm users={userOptions} projectId={project.id} />
          </ModalButton>
        }
      />
    </PageLayout>
  );
}
