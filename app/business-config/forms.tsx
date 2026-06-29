"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { FieldGroup } from "@/components/ui/field";
import { FormTextField, FormActions } from "@/components/form-fields";
import { successToast } from "@/lib/toast";
import { upsertBusinessConfig } from "./actions";

export interface BusinessConfigRecord {
  id: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddressLine1: string | null;
  businessAddressLine2: string | null;
  businessCity: string | null;
  businessState: string | null;
  businessPostcode: string | null;
  abn: string | null;
  payTo: string | null;
  bsb: string | null;
  accountNumber: string | null;
  bankName: string | null;
}

const businessConfigSchema = z.object({
  businessName: z.string().min(1, "Required.").max(100),
  businessEmail: z.string().email("Please enter a valid email.").max(255),
  businessPhone: z.string().min(1, "Required.").max(50),
  businessAddressLine1: z.string().max(100),
  businessAddressLine2: z.string().max(100),
  businessCity: z.string().max(100),
  businessState: z.string().max(100),
  businessPostcode: z.string().max(20),
  abn: z.string().max(20),
  payTo: z.string().max(100),
  bsb: z.string().max(20),
  accountNumber: z.string().max(30),
  bankName: z.string().max(100),
});

export function BusinessConfigForm({ record }: { record?: BusinessConfigRecord }) {
  const form = useForm({
    defaultValues: {
      businessName: record?.businessName ?? "",
      businessEmail: record?.businessEmail ?? "",
      businessPhone: record?.businessPhone ?? "",
      businessAddressLine1: record?.businessAddressLine1 ?? "",
      businessAddressLine2: record?.businessAddressLine2 ?? "",
      businessCity: record?.businessCity ?? "",
      businessState: record?.businessState ?? "",
      businessPostcode: record?.businessPostcode ?? "",
      abn: record?.abn ?? "",
      payTo: record?.payTo ?? "",
      bsb: record?.bsb ?? "",
      accountNumber: record?.accountNumber ?? "",
      bankName: record?.bankName ?? "",
    },
    validators: { onSubmit: businessConfigSchema },
    onSubmit: async ({ value }) => {
      const payload = {
        businessName: value.businessName,
        businessEmail: value.businessEmail,
        businessPhone: value.businessPhone,
        businessAddressLine1: value.businessAddressLine1 || null,
        businessAddressLine2: value.businessAddressLine2 || null,
        businessCity: value.businessCity || null,
        businessState: value.businessState || null,
        businessPostcode: value.businessPostcode || null,
        abn: value.abn || null,
        payTo: value.payTo || null,
        bsb: value.bsb || null,
        accountNumber: value.accountNumber || null,
        bankName: value.bankName || null,
      };

      await upsertBusinessConfig(payload, record?.id);
      successToast(record ? "Business config updated successfully!" : "Business config saved successfully!");
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
        <form.Field name="businessName">
          {(field) => <FormTextField field={field} label="Business Name" placeholder="Enter business name" />}
        </form.Field>
        <form.Field name="businessEmail">
          {(field) => <FormTextField field={field} label="Business Email" placeholder="name@example.com" type="email" />}
        </form.Field>
        <form.Field name="businessPhone">
          {(field) => <FormTextField field={field} label="Business Phone" placeholder="Enter phone number" />}
        </form.Field>
        <form.Field name="businessAddressLine1">
          {(field) => <FormTextField field={field} label="Address Line 1" placeholder="Street address" />}
        </form.Field>
        <form.Field name="businessAddressLine2">
          {(field) => <FormTextField field={field} label="Address Line 2" placeholder="Suite, unit, etc." />}
        </form.Field>
        <form.Field name="businessCity">
          {(field) => <FormTextField field={field} label="City" placeholder="City" />}
        </form.Field>
        <form.Field name="businessState">
          {(field) => <FormTextField field={field} label="State" placeholder="State" />}
        </form.Field>
        <form.Field name="businessPostcode">
          {(field) => <FormTextField field={field} label="Postcode" placeholder="Postcode" />}
        </form.Field>
        <form.Field name="abn">
          {(field) => <FormTextField field={field} label="ABN" placeholder="ABN" />}
        </form.Field>
        <form.Field name="payTo">
          {(field) => <FormTextField field={field} label="Pay To" placeholder="Payee name" />}
        </form.Field>
        <form.Field name="bsb">
          {(field) => <FormTextField field={field} label="BSB" placeholder="BSB" />}
        </form.Field>
        <form.Field name="accountNumber">
          {(field) => <FormTextField field={field} label="Account Number" placeholder="Account number" />}
        </form.Field>
        <form.Field name="bankName">
          {(field) => <FormTextField field={field} label="Bank Name" placeholder="Bank name" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
