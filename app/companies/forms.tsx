"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { FieldGroup } from "@/components/ui/field";
import {
  FormTextField,
  FormSelectField,
  FormActions,
} from "@/components/form-fields";
import { urlSchema } from "@/lib/schemas";
import { successToast } from "@/lib/toast";
import { useModalSuccess } from "@/components/modal";
import { createCompany, updateCompany } from "./actions";
import type { CompanyStatus } from "@prisma/client";

export interface CompanyRecord {
  id: string;
  name: string;
  website: string;
  industry: string;
  status: CompanyStatus;
}

const companySchema = z.object({
  name: z.string().min(2, "Must be at least 2 characters.").max(100),
  website: urlSchema,
  industry: z.string().min(2, "Must be at least 2 characters.").max(100),
  status: z.enum(["LEAD", "PROSPECT", "ACTIVE", "INACTIVE"]),
});

const statusOptions = [
  { value: "LEAD", label: "Lead" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

export function CompanyForm({ record }: { record?: CompanyRecord }) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      name: record?.name ?? "",
      website: record?.website ?? "",
      industry: record?.industry ?? "",
      status: record?.status ?? ("LEAD" as CompanyStatus),
    },
    validators: { onSubmit: companySchema },
    onSubmit: async ({ value }) => {
      if (record) {
        await updateCompany(record.id, value);
        successToast("Company updated successfully!");
      } else {
        await createCompany(value);
        successToast("Company created successfully!");
      }
      onSuccess?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="name">
          {(field) => (
            <FormTextField
              field={field}
              label="Company Name"
              placeholder="Enter company name"
            />
          )}
        </form.Field>
        <form.Field name="website">
          {(field) => (
            <FormTextField
              field={field}
              label="Website"
              placeholder="e.g. example.com.au"
            />
          )}
        </form.Field>
        <form.Field name="industry">
          {(field) => (
            <FormTextField
              field={field}
              label="Industry"
              placeholder="Enter industry"
            />
          )}
        </form.Field>
        <form.Field name="status">
          {(field) => (
            <FormSelectField
              field={field}
              label="Status"
              placeholder="Select status"
              options={statusOptions}
            />
          )}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
