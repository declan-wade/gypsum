"use client";

import { useTransition } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { RowActions } from "@/components/row-actions";
import { formatMoney } from "@/lib/format";
import { deleteInvoiceLineItem } from "./actions";

export type LineItemRow = {
  id: string;
  description: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxable: boolean;
};

function LineItemRowActions({ id }: { id: string }) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <RowActions
      actions={[
        {
          label: "Delete",
          destructive: true,
          onSelect: () =>
            startTransition(async () => {
              await deleteInvoiceLineItem(id);
              router.refresh();
            }),
        },
      ]}
    />
  );
}

export const columns: ColumnDef<LineItemRow>[] = [
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "productName",
    header: "Product",
    cell: ({ row }) => row.original.productName ?? "—",
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
  {
    accessorKey: "taxable",
    header: "GST",
    cell: ({ row }) => (row.original.taxable ? "10%" : "—"),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <LineItemRowActions id={row.original.id} />,
  },
];
