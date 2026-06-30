"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export type ActivityRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string | null;
  userName: string | null;
  createdAt: Date;
};

// Entity types that have a detail page we can link the row through to.
const ENTITY_PATHS: Record<string, string> = {
  Company: "/companies",
  Invoice: "/invoices",
  Project: "/projects",
  Task: "/tasks",
};

export const columns: ColumnDef<ActivityRow>[] = [
  {
    accessorKey: "createdAt",
    header: "When",
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    accessorKey: "entityType",
    header: "Record",
    cell: ({ row }) => {
      const path = ENTITY_PATHS[row.original.entityType];
      if (!path) return row.original.entityType;
      return (
        <Link
          href={`${path}/${row.original.entityId}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {row.original.entityType}
        </Link>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => <StatusBadge status={row.original.action} />,
  },
  {
    accessorKey: "summary",
    header: "Summary",
    cell: ({ row }) => row.original.summary ?? "—",
  },
  {
    accessorKey: "userName",
    header: "By",
    cell: ({ row }) => row.original.userName ?? "System",
  },
];
