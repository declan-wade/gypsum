"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Contact } from "@prisma/client";

export const columns: ColumnDef<Contact>[] = [
  {
    accessorKey: "firstName",
    header: "First Name",
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
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
    accessorKey: "companyId",
    header: "Company ID",
  },
  {
    accessorKey: "jobTitle",
    header: "Job Title",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];
