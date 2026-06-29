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
import { addInvoiceLineItem } from "./actions";

export interface ProductOption {
  value: string;
  label: string;
  description: string;
  unitPrice: number;
}

const lineItemSchema = z.object({
  productId: z.string(),
  description: z.string().min(1, "Required.").max(250),
  quantity: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid quantity."),
  unitPrice: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid amount."),
  taxable: z.enum(["yes", "no"]),
});

const gstOptions = [
  { value: "yes", label: "Apply GST (10%)" },
  { value: "no", label: "No GST" },
];

interface AddLineItemFormProps {
  invoiceId: string;
  products: ProductOption[];
}

export function AddLineItemForm({ invoiceId, products }: AddLineItemFormProps) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      productId: "",
      description: "",
      quantity: "1",
      unitPrice: "",
      taxable: "yes" as "yes" | "no",
    },
    validators: { onSubmit: lineItemSchema },
    onSubmit: async ({ value }) => {
      await addInvoiceLineItem(invoiceId, {
        productId: value.productId || null,
        description: value.description,
        quantity: Number(value.quantity),
        unitPrice: Number(value.unitPrice),
        taxable: value.taxable === "yes",
      });
      successToast("Line item added.");
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
        <form.Field name="productId">
          {(field) => (
            <FormSelectField
              field={field}
              label="Product"
              placeholder="Select a product (optional)"
              options={products}
              onValueChange={(value) => {
                const product = products.find((p) => p.value === value);
                if (product) {
                  form.setFieldValue("description", product.description || product.label);
                  form.setFieldValue("unitPrice", String(product.unitPrice));
                }
              }}
            />
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
        <form.Field name="taxable">
          {(field) => <FormSelectField field={field} label="GST" placeholder="Select GST" options={gstOptions} />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
