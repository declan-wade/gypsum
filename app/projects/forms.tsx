"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { FieldGroup } from "@/components/ui/field";
import {
  FormTextField,
  FormNumberField,
  FormDateField,
  FormSelectField,
  FormActions,
} from "@/components/form-fields";
import { successToast } from "@/lib/toast";
import { useModalSuccess } from "@/components/modal";
import { createProject } from "./actions";
import type { ProjectStatus } from "@prisma/client";

const optionalAmount = z
  .string()
  .refine((v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0), "Enter a valid amount.");

const projectSchema = z.object({
  name: z.string().min(2, "Must be at least 2 characters.").max(150),
  companyId: z.string().min(1, "Please select a company."),
  status: z.enum(["ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]),
  hourlyRate: optionalAmount,
  budget: optionalAmount,
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ProjectForm({
  companies,
  companyId,
}: {
  companies?: { value: string; label: string }[];
  companyId?: string;
}) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      name: "",
      companyId: companyId ?? "",
      status: "ACTIVE" as ProjectStatus,
      hourlyRate: "",
      budget: "",
      startDate: "",
      endDate: "",
      description: "",
    },
    validators: { onSubmit: projectSchema },
    onSubmit: async ({ value }) => {
      await createProject({
        name: value.name,
        companyId: value.companyId,
        status: value.status,
        hourlyRate: value.hourlyRate ? Number(value.hourlyRate) : null,
        budget: value.budget ? Number(value.budget) : null,
        startDate: value.startDate ? new Date(value.startDate) : null,
        endDate: value.endDate ? new Date(value.endDate) : null,
        description: value.description || null,
      });
      successToast("Project created successfully!");
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
          {(field) => <FormTextField field={field} label="Name" placeholder="Enter project name" />}
        </form.Field>
        {!companyId && companies && (
          <form.Field name="companyId">
            {(field) => (
              <FormSelectField field={field} label="Company" placeholder="Select a company" options={companies} />
            )}
          </form.Field>
        )}
        <form.Field name="status">
          {(field) => (
            <FormSelectField field={field} label="Status" placeholder="Select a status" options={statusOptions} />
          )}
        </form.Field>
        <form.Field name="hourlyRate">
          {(field) => <FormNumberField field={field} label="Hourly Rate" placeholder="0.00" step="0.01" />}
        </form.Field>
        <form.Field name="budget">
          {(field) => <FormNumberField field={field} label="Budget" placeholder="0.00" step="0.01" />}
        </form.Field>
        <form.Field name="startDate">
          {(field) => <FormDateField field={field} label="Start Date" />}
        </form.Field>
        <form.Field name="endDate">
          {(field) => <FormDateField field={field} label="End Date" />}
        </form.Field>
        <form.Field name="description">
          {(field) => <FormTextField field={field} label="Description" placeholder="Optional notes" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
