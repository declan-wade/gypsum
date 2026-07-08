"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { RowActions } from "@/components/row-actions";
import { formatMoney } from "@/lib/format";
import { deleteQuoteLineItem } from "./actions";
import { EditLineItemForm, ProductOption } from "./forms";

export type LineItemRow = {
  id: string;
  productId: string | null;
  description: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxable: boolean;
};

function LineItemRowActions({ row, products }: { row: LineItemRow; products: ProductOption[] }) {
  const router = useRouter();

  return (
    <RowActions
      editTitle="Edit Line Item"
      editForm={<EditLineItemForm lineItem={row} products={products} />}
      actions={[
        {
          label: "Delete",
          destructive: true,
          confirm: {
            title: "Delete line item?",
            description: `"${row.description}" will be removed and the quote's totals recalculated.`,
            confirmLabel: "Delete",
          },
          onSelect: async () => {
            await deleteQuoteLineItem(row.id);
            router.refresh();
          },
        },
      ]}
    />
  );
}

export function getColumns(products: ProductOption[]): ColumnDef<LineItemRow>[] {
  return [
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
      cell: ({ row }) => <LineItemRowActions row={row.original} products={products} />,
    },
  ];
}
