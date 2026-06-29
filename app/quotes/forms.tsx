"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { FieldGroup } from "@/components/ui/field";
import {
  FormTextField,
  FormDateField,
  FormSelectField,
  FormActions,
} from "@/components/form-fields";
import { successToast } from "@/lib/toast";
import { useModalSuccess } from "@/components/modal";
import { createQuote, updateQuote } from "./actions";
import { toDateInputValue } from "@/lib/format";
import type { QuoteStatus } from "@prisma/client";

export interface QuoteRecord {
  id: string;
  number: string;
  status: QuoteStatus;
  companyId: string;
  expiryDate: Date | null;
  notes: string | null;
}

const quoteSchema = z.object({
  number: z.string().min(1, "Required.").max(50),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
  companyId: z.string().min(1, "Please select a company."),
  expiryDate: z.string(),
  notes: z.string(),
});

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
];

export function QuoteForm({
  companies,
  companyId,
  record,
}: {
  companies?: { value: string; label: string }[];
  companyId?: string;
  record?: QuoteRecord;
}) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      number: record?.number ?? "",
      status: record?.status ?? ("DRAFT" as QuoteStatus),
      companyId: record?.companyId ?? companyId ?? "",
      expiryDate: toDateInputValue(record?.expiryDate),
      notes: record?.notes ?? "",
    },
    validators: { onSubmit: quoteSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        number: value.number,
        status: value.status,
        companyId: value.companyId,
        expiryDate: value.expiryDate ? new Date(value.expiryDate) : null,
        notes: value.notes || null,
      };
      if (record) {
        await updateQuote(record.id, payload);
        successToast("Quote updated successfully!");
      } else {
        await createQuote(payload);
        successToast("Quote created successfully!");
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
        <form.Field name="number">
          {(field) => <FormTextField field={field} label="Quote Number" placeholder="e.g. Q-1001" />}
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
        <form.Field name="expiryDate">
          {(field) => <FormDateField field={field} label="Expiry Date" />}
        </form.Field>
        <form.Field name="notes">
          {(field) => <FormTextField field={field} label="Notes" placeholder="Optional notes" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
