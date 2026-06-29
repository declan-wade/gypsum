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
import { createInvoice, updateInvoice } from "./actions";
import { toDateInputValue } from "@/lib/format";
import type { InvoiceStatus } from "@prisma/client";

export interface InvoiceRecord {
  id: string;
  number: string;
  status: InvoiceStatus;
  companyId: string;
  dueDate: Date | null;
  notes: string | null;
}

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
  record,
}: {
  companies?: { value: string; label: string }[];
  companyId?: string;
  record?: InvoiceRecord;
}) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      number: record?.number ?? "",
      status: record?.status ?? ("DRAFT" as InvoiceStatus),
      companyId: record?.companyId ?? companyId ?? "",
      dueDate: toDateInputValue(record?.dueDate),
      notes: record?.notes ?? "",
    },
    validators: { onSubmit: invoiceSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        number: value.number,
        status: value.status,
        companyId: value.companyId,
        dueDate: value.dueDate ? new Date(value.dueDate) : null,
        notes: value.notes || null,
      };
      if (record) {
        await updateInvoice(record.id, payload);
        successToast("Invoice updated successfully!");
      } else {
        await createInvoice(payload);
        successToast("Invoice created successfully!");
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
