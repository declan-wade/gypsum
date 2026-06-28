"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { FieldGroup } from "@/components/ui/field";
import {
  FormTextField,
  FormNumberField,
  FormSelectField,
  FormActions,
} from "@/components/form-fields";
import { successToast } from "@/lib/toast";
import { useModalSuccess } from "@/components/modal";
import { createLineItem } from "./actions";

const lineItemSchema = z.object({
  invoiceId: z.string().min(1, "Please select an invoice."),
  description: z.string().min(1, "Required.").max(250),
  quantity: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid quantity."),
  unitPrice: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid amount."),
});

export function LineItemForm({ invoices }: { invoices: { value: string; label: string }[] }) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      invoiceId: "",
      description: "",
      quantity: "1",
      unitPrice: "",
    },
    validators: { onSubmit: lineItemSchema },
    onSubmit: async ({ value }) => {
      await createLineItem({
        invoiceId: value.invoiceId,
        description: value.description,
        quantity: Number(value.quantity),
        unitPrice: Number(value.unitPrice),
      });
      successToast("Line item created successfully!");
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
        <form.Field name="invoiceId">
          {(field) => (
            <FormSelectField field={field} label="Invoice" placeholder="Select an invoice" options={invoices} />
          )}
        </form.Field>
        <form.Field name="description">
          {(field) => <FormTextField field={field} label="Description" placeholder="Enter description" />}
        </form.Field>
        <form.Field name="quantity">
          {(field) => <FormNumberField field={field} label="Quantity" placeholder="1" step="0.01" />}
        </form.Field>
        <form.Field name="unitPrice">
          {(field) => <FormNumberField field={field} label="Unit Price" placeholder="0.00" step="0.01" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
