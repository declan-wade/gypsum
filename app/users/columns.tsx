"use client";

import { PencilIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { ModalButton } from "@/components/modal";
import { AuthUserForm } from "./forms";
import type { AuthUser } from "@/lib/auth/users";

export const columns: ColumnDef<AuthUser>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => <StatusBadge status={row.original.role.toUpperCase()} />,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.banned ? "INACTIVE" : "ACTIVE"} />,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ModalButton icon={<PencilIcon />} variant="ghost" size="icon-sm" title="Edit User">
        <AuthUserForm record={row.original} />
      </ModalButton>
    ),
  },
];
