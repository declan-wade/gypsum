"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatDuration } from "@/lib/format";
import type { RunSummary } from "@/lib/workflow-observability";

export const columns: ColumnDef<RunSummary>[] = [
  {
    accessorKey: "workflowName",
    header: "Workflow",
    cell: ({ row }) => (
      <Link
        href={`/workflows/${row.original.runId}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.workflowName}
      </Link>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "runId",
    header: "Run ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.runId.slice(0, 12)}…
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Started",
    cell: ({ row }) => formatDateTime(row.original.startedAt ?? row.original.createdAt),
  },
  {
    accessorKey: "durationMs",
    header: "Duration",
    cell: ({ row }) => (
      <span className={row.original.status === "running" ? "text-amber-600 dark:text-amber-400" : undefined}>
        {formatDuration(row.original.durationMs)}
        {row.original.status === "running" ? " …" : ""}
      </span>
    ),
  },
  {
    accessorKey: "errorMessage",
    header: "Error",
    cell: ({ row }) =>
      row.original.errorMessage ? (
        <span className="text-xs text-red-600 dark:text-red-400" title={row.original.errorMessage}>
          {row.original.errorMessage.length > 60
            ? `${row.original.errorMessage.slice(0, 60)}…`
            : row.original.errorMessage}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];
