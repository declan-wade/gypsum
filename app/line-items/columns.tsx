"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatMoney } from "@/lib/format";

export type LineItemRow = {
  id: string;
  invoiceNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export const columns: ColumnDef<LineItemRow>[] = [
  {
    accessorKey: "invoiceNumber",
    header: "Invoice",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => formatMoney(row.original.unitPrice),
  },
  {
    accessorKey: "lineTotal",
    header: "Total",
    cell: ({ row }) => formatMoney(row.original.lineTotal),
  },
];
