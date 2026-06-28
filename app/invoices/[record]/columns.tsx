"use client";

import { useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { deleteInvoiceLineItem } from "./actions";

export type LineItemRow = {
  id: string;
  description: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function DeleteLineItemButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Delete line item"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteInvoiceLineItem(id);
          router.refresh();
        })
      }
    >
      <Trash2Icon />
    </Button>
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
    id: "actions",
    header: "",
    cell: ({ row }) => <DeleteLineItemButton id={row.original.id} />,
  },
];
