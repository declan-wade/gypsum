"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "@/components/row-actions";
import { AuthUserForm } from "./forms";
import type { AuthUser } from "@/lib/auth/users";

interface CompanyOption {
  value: string;
  label: string;
}

// A factory so each row's edit form can be handed the company options
// (columns are static, but the company dropdown needs the fetched list).
export function getColumns(companies: CompanyOption[]): ColumnDef<AuthUser>[] {
  return [
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
      id: "company",
      header: "Company",
      cell: ({ row }) => row.original.companyName ?? "—",
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
        <RowActions
          editTitle="Edit User"
          editForm={<AuthUserForm record={row.original} companies={companies} />}
        />
      ),
    },
  ];
}
