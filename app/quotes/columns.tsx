"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export type QuoteRow = {
  id: string;
  number: string;
  companyName: string;
  status: string;
  total: number;
  issueDate: Date;
  expiryDate: Date | null;
};

export const columns: ColumnDef<QuoteRow>[] = [
  {
    accessorKey: "number",
    header: "Number",
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
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatMoney(row.original.total),
  },
  {
    accessorKey: "issueDate",
    header: "Issued",
    cell: ({ row }) => formatDate(row.original.issueDate),
  },
  {
    accessorKey: "expiryDate",
    header: "Expires",
    cell: ({ row }) => formatDate(row.original.expiryDate),
  },
];
