"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export type ProjectRow = {
  id: string;
  name: string;
  companyName: string;
  status: string;
  budget: number | null;
  startDate: Date | null;
  endDate: Date | null;
};

export const columns: ColumnDef<ProjectRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "companyName",
    header: "Company",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "budget",
    header: "Budget",
    cell: ({ row }) => formatMoney(row.original.budget),
  },
  {
    accessorKey: "startDate",
    header: "Start",
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: "endDate",
    header: "End",
    cell: ({ row }) => formatDate(row.original.endDate),
  },
];
