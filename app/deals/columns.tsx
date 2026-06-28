"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export type DealRow = {
  id: string;
  title: string;
  value: number;
  stage: string;
  companyName: string;
  expectedCloseDate: Date | null;
};

export const columns: ColumnDef<DealRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "companyName",
    header: "Company",
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => <StatusBadge status={row.original.stage} />,
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) => formatMoney(row.original.value),
  },
  {
    accessorKey: "expectedCloseDate",
    header: "Expected Close",
    cell: ({ row }) => formatDate(row.original.expectedCloseDate),
  },
];
