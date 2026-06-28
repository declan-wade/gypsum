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
import { createInvoice } from "./actions";
import type { InvoiceStatus } from "@prisma/client";

const invoiceSchema = z.object({
  number: z.string().min(1, "Required.").max(50),
  status: z.enum(["DRAFT", "SENT", "PARTIAL", "PAID", "OVERDUE", "VOID"]),
  companyId: z.string().min(1, "Please select a company."),
  dueDate: z.string(),
  notes: z.string(),
});

const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "VOID", label: "Void" },
];

export function InvoiceForm({
  companies,
  companyId,
}: {
  companies?: { value: string; label: string }[];
  companyId?: string;
}) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      number: "",
      status: "DRAFT" as InvoiceStatus,
      companyId: companyId ?? "",
      dueDate: "",
      notes: "",
    },
    validators: { onSubmit: invoiceSchema },
    onSubmit: async ({ value }) => {
      await createInvoice({
        number: value.number,
        status: value.status,
        companyId: value.companyId,
        dueDate: value.dueDate ? new Date(value.dueDate) : null,
        notes: value.notes || null,
      });
      successToast("Invoice created successfully!");
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
          {(field) => <FormTextField field={field} label="Invoice Number" placeholder="e.g. INV-1001" />}
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
        <form.Field name="dueDate">
          {(field) => <FormDateField field={field} label="Due Date" />}
        </form.Field>
        <form.Field name="notes">
          {(field) => <FormTextField field={field} label="Notes" placeholder="Optional notes" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
