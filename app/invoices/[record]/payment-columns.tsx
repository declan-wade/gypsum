"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

import { RowActions } from "@/components/row-actions";
import { formatMoney, formatDate } from "@/lib/format";
import { deletePayment } from "./actions";

export type PaymentRow = {
  id: string;
  paidAt: Date;
  amount: number;
  method: string;
  reference: string | null;
};

function humanizeMethod(method: string) {
  return method
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function PaymentRowActions({ id, amount }: { id: string; amount: number }) {
  const router = useRouter();

  return (
    <RowActions
      actions={[
        {
          label: "Delete",
          destructive: true,
          confirm: {
            title: "Delete payment?",
            description: `The payment of ${formatMoney(amount)} will be removed and the invoice balance recalculated.`,
            confirmLabel: "Delete",
          },
          onSelect: async () => {
            await deletePayment(id);
            router.refresh();
          },
        },
      ]}
    />
  );
}

export const paymentColumns: ColumnDef<PaymentRow>[] = [
  {
    accessorKey: "paidAt",
    header: "Paid On",
    cell: ({ row }) => formatDate(row.original.paidAt),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => formatMoney(row.original.amount),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => humanizeMethod(row.original.method),
  },
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => row.original.reference ?? "—",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <PaymentRowActions id={row.original.id} amount={row.original.amount} />,
  },
];
