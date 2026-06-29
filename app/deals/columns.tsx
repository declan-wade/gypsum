"use client";

import { PencilIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { DealStage } from "@prisma/client";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ModalButton } from "@/components/modal";
import { DealForm } from "./forms";

export type DealRow = {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  companyId: string;
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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ModalButton icon={<PencilIcon />} variant="ghost" size="icon-sm" title="Edit Deal">
        <DealForm
          record={{
            id: row.original.id,
            title: row.original.title,
            value: row.original.value,
            stage: row.original.stage,
            companyId: row.original.companyId,
            expectedCloseDate: row.original.expectedCloseDate,
          }}
        />
      </ModalButton>
    ),
  },
];
