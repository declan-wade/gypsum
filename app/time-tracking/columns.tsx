"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/format";

export type TimeEntryRow = {
  id: string;
  date: Date;
  userName: string;
  projectName: string;
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
];
