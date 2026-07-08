"use client";

import { useForm } from "@tanstack/react-form";
import * as z from "zod";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  FormTextField,
  FormSelectField,
  FormActions,
} from "@/components/form-fields";
import { successToast } from "@/lib/toast";
import { useModalSuccess } from "@/components/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { createAuthUser, updateAuthUser, resetAuthUserPassword } from "./actions";
import type { AuthUser } from "@/lib/auth/users";
import { GRANTABLE_MODULES } from "@/lib/modules";

const ALL_GRANTABLE_KEYS = GRANTABLE_MODULES.map((m) => m.key);

const roleOptions = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Sentinel for "no company" — a client user links to a company, staff accounts
// don't. The base-ui Select can't hold an empty-string value, so we use this.
const NO_COMPANY = "none";

interface CompanyOption {
  value: string;
  label: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function AuthUserForm({
  record,
  companies = [],
  initialModules,
}: {
  record?: AuthUser;
  companies?: CompanyOption[];
  // Granted module keys for edit mode. New users default to all modules.
  initialModules?: string[];
}) {
  const onSuccess = useModalSuccess();
  const isEdit = !!record;

  const companyOptions = [{ value: NO_COMPANY, label: "No company (staff)" }, ...companies];

  // One schema for both modes; create requires email + password, edit treats
  // password as an optional reset (blank = unchanged).
  const userSchema = z
    .object({
      name: z.string().min(2, "Must be at least 2 characters.").max(100),
      email: z.string(),
      password: z.string(),
      role: z.enum(["user", "admin"]),
      status: z.enum(["active", "inactive"]),
      companyId: z.string(),
      modules: z.array(z.string()),
    })
    .superRefine((val, ctx) => {
      if (!isEdit && !EMAIL_RE.test(val.email)) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Please enter a valid email address." });
      }
      if (!isEdit && val.password.length < 8) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "Must be at least 8 characters." });
      }
      if (isEdit && val.password !== "" && val.password.length < 8) {
        ctx.addIssue({ code: "custom", path: ["password"], message: "Must be at least 8 characters." });
      }
    });

  const form = useForm({
    defaultValues: {
      name: record?.name ?? "",
      email: record?.email ?? "",
      password: "",
      role: (record?.role === "admin" ? "admin" : "user") as "user" | "admin",
      status: record?.banned ? "inactive" : "active",
      companyId: record?.companyId ?? NO_COMPANY,
      // New users start with access to all modules (admin unchecks to restrict);
      // editing shows the user's current grants.
      modules: isEdit ? (initialModules ?? []) : ALL_GRANTABLE_KEYS,
    },
    validators: { onSubmit: userSchema },
    onSubmit: async ({ value }) => {
      const companyId = value.companyId === NO_COMPANY ? null : value.companyId;
      if (record) {
        await updateAuthUser(record.id, {
          name: value.name,
          role: value.role,
          active: value.status === "active",
          companyId,
          modules: value.modules,
        });
        if (value.password) {
          await resetAuthUserPassword(record.id, value.password);
        }
        successToast("User updated successfully!");
      } else {
        await createAuthUser({
          name: value.name,
          email: value.email,
          password: value.password,
          role: value.role,
          companyId,
          modules: value.modules,
        });
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
        {!isEdit && (
          <form.Field name="email">
            {(field) => <FormTextField field={field} label="Email" placeholder="Enter email" type="email" />}
          </form.Field>
        )}
        <form.Field name="password">
          {(field) => (
            <FormTextField
              field={field}
              label={isEdit ? "New Password" : "Password"}
              placeholder={isEdit ? "Leave blank to keep current" : "Set a password"}
              type="password"
            />
          )}
        </form.Field>
        <form.Field name="role">
          {(field) => (
            <FormSelectField field={field} label="Role" placeholder="Select a role" options={roleOptions} />
          )}
        </form.Field>
        <form.Field name="companyId">
          {(field) => (
            <FormSelectField
              field={field}
              label="Company"
              placeholder="Select a company"
              options={companyOptions}
            />
          )}
        </form.Field>
        {isEdit && (
          <form.Field name="status">
            {(field) => (
              <FormSelectField field={field} label="Status" placeholder="Select status" options={statusOptions} />
            )}
          </form.Field>
        )}

        <form.Subscribe selector={(state) => state.values.role}>
          {(role) =>
            role === "admin" ? (
              <Field>
                <FieldLabel>Module access</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Admins have access to all modules.
                </p>
              </Field>
            ) : (
              <form.Field name="modules">
                {(field) => {
                  const selected = new Set(field.state.value);
                  const toggle = (key: string, checked: boolean) => {
                    const next = new Set(selected);
                    if (checked) next.add(key);
                    else next.delete(key);
                    field.handleChange([...next]);
                  };
                  return (
                    <Field>
                      <FieldLabel>Module access</FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {GRANTABLE_MODULES.map((module) => (
                          <label
                            key={module.key}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={selected.has(module.key)}
                              onCheckedChange={(checked) =>
                                toggle(module.key, checked === true)
                              }
                            />
                            {module.label}
                          </label>
                        ))}
                      </div>
                    </Field>
                  );
                }}
              </form.Field>
            )
          }
        </form.Subscribe>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
