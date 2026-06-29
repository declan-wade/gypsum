"use client";

import { PencilIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import type { Contact } from "@prisma/client";
import { ModalButton } from "@/components/modal";
import { ContactForm } from "./forms";

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
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <ModalButton icon={<PencilIcon />} variant="ghost" size="icon-sm" title="Edit Contact">
        <ContactForm
          record={{
            id: row.original.id,
            firstName: row.original.firstName,
            lastName: row.original.lastName,
            email: row.original.email ?? "",
            phone: row.original.phone ?? "",
            jobTitle: row.original.jobTitle ?? "",
            companyId: row.original.companyId,
          }}
        />
      </ModalButton>
    ),
  },
];
