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
import { createDeal, updateDeal } from "./actions";
import { toDateInputValue } from "@/lib/format";
import type { DealStage } from "@prisma/client";

export interface DealRecord {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  companyId: string;
  expectedCloseDate: Date | null;
}

const dealSchema = z.object({
  title: z.string().min(2, "Must be at least 2 characters.").max(150),
  value: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid amount."),
  stage: z.enum(["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]),
  companyId: z.string().min(1, "Please select a company."),
  expectedCloseDate: z.string(),
});

const stageOptions = [
  { value: "QUALIFICATION", label: "Qualification" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

export function DealForm({
  companies,
  companyId,
  record,
}: {
  companies?: { value: string; label: string }[];
  companyId?: string;
  record?: DealRecord;
}) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      title: record?.title ?? "",
      value: record?.value != null ? String(record.value) : "",
      stage: record?.stage ?? ("QUALIFICATION" as DealStage),
      companyId: record?.companyId ?? companyId ?? "",
      expectedCloseDate: toDateInputValue(record?.expectedCloseDate),
    },
    validators: { onSubmit: dealSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        title: value.title,
        value: Number(value.value),
        stage: value.stage,
        companyId: value.companyId,
        expectedCloseDate: value.expectedCloseDate
          ? new Date(value.expectedCloseDate)
          : null,
      };
      if (record) {
        await updateDeal(record.id, payload);
        successToast("Deal updated successfully!");
      } else {
        await createDeal(payload);
        successToast("Deal created successfully!");
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
        <form.Field name="title">
          {(field) => <FormTextField field={field} label="Title" placeholder="Enter deal title" />}
        </form.Field>
        {!companyId && companies && (
          <form.Field name="companyId">
            {(field) => (
              <FormSelectField field={field} label="Company" placeholder="Select a company" options={companies} />
            )}
          </form.Field>
        )}
        <form.Field name="value">
          {(field) => <FormNumberField field={field} label="Value" placeholder="0.00" step="0.01" />}
        </form.Field>
        <form.Field name="stage">
          {(field) => (
            <FormSelectField field={field} label="Stage" placeholder="Select a stage" options={stageOptions} />
          )}
        </form.Field>
        <form.Field name="expectedCloseDate">
          {(field) => <FormDateField field={field} label="Expected Close Date" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
