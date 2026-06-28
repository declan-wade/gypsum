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
import { createProduct } from "./actions";
import type { ProductType } from "@prisma/client";

const productSchema = z.object({
  name: z.string().min(2, "Must be at least 2 characters.").max(150),
  sku: z.string(),
  type: z.enum(["PRODUCT", "SERVICE"]),
  unitPrice: z
    .string()
    .min(1, "Required.")
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid amount."),
  description: z.string(),
});

const typeOptions = [
  { value: "SERVICE", label: "Service" },
  { value: "PRODUCT", label: "Product" },
];

export function ProductForm() {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      name: "",
      sku: "",
      type: "SERVICE" as ProductType,
      unitPrice: "",
      description: "",
    },
    validators: { onSubmit: productSchema },
    onSubmit: async ({ value }) => {
      await createProduct({
        name: value.name,
        sku: value.sku || null,
        type: value.type,
        unitPrice: Number(value.unitPrice),
        description: value.description || null,
      });
      successToast("Product created successfully!");
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
          {(field) => <FormTextField field={field} label="Name" placeholder="Enter product name" />}
        </form.Field>
        <form.Field name="sku">
          {(field) => <FormTextField field={field} label="SKU" placeholder="Enter SKU (optional)" />}
        </form.Field>
        <form.Field name="type">
          {(field) => (
            <FormSelectField field={field} label="Type" placeholder="Select a type" options={typeOptions} />
          )}
        </form.Field>
        <form.Field name="unitPrice">
          {(field) => <FormNumberField field={field} label="Unit Price" placeholder="0.00" step="0.01" />}
        </form.Field>
        <form.Field name="description">
          {(field) => <FormTextField field={field} label="Description" placeholder="Enter description (optional)" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
