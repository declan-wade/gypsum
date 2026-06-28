"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { FieldGroup } from "@/components/ui/field";
import {
  FormTextField,
  FormSelectField,
  FormActions,
} from "@/components/form-fields";
import { successToast } from "@/lib/toast";
import { useModalSuccess } from "@/components/modal";
import { createContact } from "./actions";

const contactSchema = z.object({
  firstName: z.string().min(2, "Must be at least 2 characters.").max(100),
  lastName: z.string().min(2, "Must be at least 2 characters.").max(100),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string(),
  jobTitle: z.string().min(2, "Must be at least 2 characters.").max(100),
  companyId: z.string().min(1, "Please select a company."),
});

interface CompanyOption {
  value: string;
  label: string;
}

interface ContactFormProps {
  companies?: CompanyOption[];
  companyId?: string;
}

export function ContactForm({ companies, companyId }: ContactFormProps) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      companyId: companyId ?? "",
    },
    validators: { onSubmit: contactSchema },
    onSubmit: async ({ value }) => {
      await createContact(value);
      successToast("Contact created successfully!");
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
        <form.Field name="firstName">
          {(field) => (
            <FormTextField
              field={field}
              label="First Name"
              placeholder="Enter first name"
            />
          )}
        </form.Field>
        <form.Field name="lastName">
          {(field) => (
            <FormTextField
              field={field}
              label="Last Name"
              placeholder="Enter last name"
            />
          )}
        </form.Field>
        <form.Field name="email">
          {(field) => (
            <FormTextField
              field={field}
              label="Email"
              placeholder="Enter email"
              type="email"
            />
          )}
        </form.Field>
        <form.Field name="phone">
          {(field) => (
            <FormTextField
              field={field}
              label="Phone"
              placeholder="Enter phone number"
              type="tel"
            />
          )}
        </form.Field>
        <form.Field name="jobTitle">
          {(field) => (
            <FormTextField
              field={field}
              label="Job Title"
              placeholder="Enter job title"
            />
          )}
        </form.Field>
        {!companyId && companies && (
          <form.Field name="companyId">
            {(field) => (
              <FormSelectField
                field={field}
                label="Company"
                placeholder="Select a company"
                options={companies}
              />
            )}
          </form.Field>
        )}
      </FieldGroup>
      <FormActions />
    </form>
  );
}
