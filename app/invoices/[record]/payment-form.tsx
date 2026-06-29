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
import { toDateInputValue } from "@/lib/format";
import { addPayment } from "./actions";
import type { PaymentMethod } from "@prisma/client";

const paymentSchema = z.object({
  amount: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount."),
  method: z.enum(["BANK_TRANSFER", "CARD", "CASH", "CHEQUE", "OTHER"]),
  paidAt: z.string().min(1, "Required."),
  reference: z.string(),
  notes: z.string(),
});

const methodOptions = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CARD", label: "Card" },
  { value: "CASH", label: "Cash" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      amount: "",
      method: "BANK_TRANSFER" as PaymentMethod,
      paidAt: toDateInputValue(new Date()),
      reference: "",
      notes: "",
    },
    validators: { onSubmit: paymentSchema },
    onSubmit: async ({ value }) => {
      await addPayment(invoiceId, {
        amount: Number(value.amount),
        method: value.method,
        paidAt: new Date(value.paidAt),
        reference: value.reference || null,
        notes: value.notes || null,
      });
      successToast("Payment recorded.");
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
        <form.Field name="amount">
          {(field) => <FormNumberField field={field} label="Amount" placeholder="0.00" step="0.01" />}
        </form.Field>
        <form.Field name="method">
          {(field) => (
            <FormSelectField field={field} label="Method" placeholder="Select a method" options={methodOptions} />
          )}
        </form.Field>
        <form.Field name="paidAt">
          {(field) => <FormDateField field={field} label="Paid On" />}
        </form.Field>
        <form.Field name="reference">
          {(field) => <FormTextField field={field} label="Reference" placeholder="Optional reference" />}
        </form.Field>
        <form.Field name="notes">
          {(field) => <FormTextField field={field} label="Notes" placeholder="Optional notes" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
