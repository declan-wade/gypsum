"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  type: string;
  unitPrice: number;
};

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => row.original.sku ?? "—",
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <StatusBadge status={row.original.type} />,
  },
  {
    accessorKey: "unitPrice",
    header: "Unit Price",
    cell: ({ row }) => formatMoney(row.original.unitPrice),
  },
];
