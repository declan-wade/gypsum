"use client";

import { PencilIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { QuoteStatus } from "@prisma/client";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ModalButton } from "@/components/modal";
import { QuoteForm } from "./forms";

export type QuoteRow = {
  id: string;
  number: string;
  companyId: string;
  companyName: string;
  status: QuoteStatus;
  total: number;
  issueDate: Date;
  expiryDate: Date | null;
  notes: string | null;
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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ModalButton icon={<PencilIcon />} variant="ghost" size="icon-sm" title="Edit Quote">
        <QuoteForm
          record={{
            id: row.original.id,
            number: row.original.number,
            status: row.original.status,
            companyId: row.original.companyId,
            expiryDate: row.original.expiryDate,
            notes: row.original.notes,
          }}
        />
      </ModalButton>
    ),
  },
];
