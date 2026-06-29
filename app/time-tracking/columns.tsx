"use client";

import { PencilIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/format";
import { ModalButton } from "@/components/modal";
import { TimeEntryForm } from "./forms";

export type TimeEntryRow = {
  id: string;
  date: Date;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  taskId: string | null;
  durationMinutes: number;
  billable: boolean;
  description: string | null;
};

export const columns: ColumnDef<TimeEntryRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "userName",
    header: "User",
  },
  {
    accessorKey: "projectName",
    header: "Project",
  },
  {
    accessorKey: "durationMinutes",
    header: "Duration",
    cell: ({ row }) => `${(row.original.durationMinutes / 60).toFixed(2)} h`,
  },
  {
    accessorKey: "billable",
    header: "Billable",
    cell: ({ row }) => (row.original.billable ? "Yes" : "No"),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description ?? "—",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ModalButton icon={<PencilIcon />} variant="ghost" size="icon-sm" title="Edit Time Entry">
        <TimeEntryForm
          record={{
            id: row.original.id,
            userId: row.original.userId,
            projectId: row.original.projectId,
            taskId: row.original.taskId,
            date: row.original.date,
            durationMinutes: row.original.durationMinutes,
            description: row.original.description,
          }}
        />
      </ModalButton>
    ),
  },
];
