"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/status-badge";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
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
];
