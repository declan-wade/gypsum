"use client";

import { PencilIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { UserRole } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";
import { ModalButton } from "@/components/modal";
import { UserForm } from "./forms";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export const columns: ColumnDef<UserRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <StatusBadge status={row.original.role} />,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (row.original.isActive ? "Active" : "Inactive"),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ModalButton icon={<PencilIcon />} variant="ghost" size="icon-sm" title="Edit User">
        <UserForm
          record={{
            id: row.original.id,
            name: row.original.name,
            email: row.original.email,
            role: row.original.role,
          }}
        />
      </ModalButton>
    ),
  },
];
