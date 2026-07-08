"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "@/components/row-actions";
import { deleteTask } from "./actions";

export type TaskRow = {
  id: string;
  title: string;
  projectName: string;
  assigneeName: string | null;
  status: string;
  dueDate: Date | null;
};

function TaskRowActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();

  return (
    <RowActions
      actions={[
        {
          label: "Delete",
          destructive: true,
          confirm: {
            title: "Delete task?",
            description: `"${title}" will be permanently deleted. This can't be undone.`,
            confirmLabel: "Delete",
          },
          onSelect: async () => {
            await deleteTask(id);
            router.refresh();
          },
        },
      ]}
    />
  );
}

export const columns: ColumnDef<TaskRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <Link
        href={`/tasks/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: "projectName",
    header: "Project",
  },
  {
    accessorKey: "assigneeName",
    header: "Assignee",
    cell: ({ row }) => row.original.assigneeName ?? "Unassigned",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <TaskRowActions id={row.original.id} title={row.original.title} />,
  },
];
