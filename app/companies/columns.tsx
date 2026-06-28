"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import type { Company } from "@prisma/client"
import { StatusBadge } from "@/components/status-badge"

export const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/companies/${row.original.id}`}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "website",
    header: "Website",
  },
  {
    accessorKey: "industry",
    header: "Industry", 
  },
    {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]