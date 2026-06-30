"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "@/components/row-actions";

export type InvoiceRow = {
  id: string;
  number: string;
  companyName: string;
  status: string;
  total: number;
  amountPaid: number;
  dueDate: Date | null;
};

export const columns: ColumnDef<InvoiceRow>[] = [
  {
    accessorKey: "number",
    header: "Number",
    cell: ({ row }) => (
      <Link
        href={`/invoices/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.number}
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
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => formatMoney(row.original.total),
  },
  {
    accessorKey: "amountPaid",
    header: "Paid",
    cell: ({ row }) => formatMoney(row.original.amountPaid),
  },
  {
    accessorKey: "dueDate",
    header: "Due",
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <RowActions
        actions={[
          {
            label: "Download PDF",
            onSelect: () =>
              window.open(`/api/invoices/${row.original.id}/pdf`, "_blank"),
          },
        ]}
      />
    ),
  },
];
