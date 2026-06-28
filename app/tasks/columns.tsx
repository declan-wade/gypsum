"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export type TaskRow = {
  id: string;
  title: string;
  projectName: string;
  status: string;
  dueDate: Date | null;
};

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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
];
