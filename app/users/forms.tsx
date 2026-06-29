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
import { createUser, updateUser } from "./actions";
import type { UserRole } from "@prisma/client";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const userSchema = z.object({
  name: z.string().min(2, "Must be at least 2 characters.").max(100),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
});

const roleOptions = [
  { value: "MEMBER", label: "Member" },
  { value: "MANAGER", label: "Manager" },
  { value: "ADMIN", label: "Admin" },
];

export function UserForm({ record }: { record?: UserRecord }) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      name: record?.name ?? "",
      email: record?.email ?? "",
      role: record?.role ?? ("MEMBER" as UserRole),
    },
    validators: { onSubmit: userSchema },
    onSubmit: async ({ value }) => {
      if (record) {
        await updateUser(record.id, value);
        successToast("User updated successfully!");
      } else {
        await createUser(value);
        successToast("User created successfully!");
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
        <form.Field name="name">
          {(field) => <FormTextField field={field} label="Name" placeholder="Enter full name" />}
        </form.Field>
        <form.Field name="email">
          {(field) => <FormTextField field={field} label="Email" placeholder="Enter email" type="email" />}
        </form.Field>
        <form.Field name="role">
          {(field) => (
            <FormSelectField field={field} label="Role" placeholder="Select a role" options={roleOptions} />
          )}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
