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
import { createTimeEntry, updateTimeEntry } from "./actions";
import { toDateInputValue } from "@/lib/format";

export interface TimeEntryRecord {
  id: string;
  userId: string;
  projectId: string;
  taskId: string | null;
  date: Date;
  durationMinutes: number;
  description: string | null;
}

const timeEntrySchema = z.object({
  userId: z.string().min(1, "Please select a user."),
  projectId: z.string().min(1, "Please select a project."),
  date: z.string().min(1, "Required."),
  durationMinutes: z
    .string()
    .min(1, "Required.")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, "Enter whole minutes."),
  description: z.string(),
});

interface TimeEntryFormProps {
  // Shown as a select when provided; on row edit it's omitted and the record's
  // user is kept (same approach as the company/project selects elsewhere).
  users?: { value: string; label: string }[];
  // List page passes selectable projects; the project/task pages pass a fixed id.
  projects?: { value: string; label: string }[];
  projectId?: string;
  taskId?: string;
  // Neon Auth id of the signed-in user, used to pre-select "me" on a new entry.
  currentUserId?: string;
  record?: TimeEntryRecord;
}

export function TimeEntryForm({ users, projects, projectId, taskId, currentUserId, record }: TimeEntryFormProps) {
  const onSuccess = useModalSuccess();
  const fixedTaskId = record?.taskId ?? taskId ?? null;
  const form = useForm({
    defaultValues: {
      userId: record?.userId ?? currentUserId ?? "",
      projectId: record?.projectId ?? projectId ?? "",
      date: toDateInputValue(record?.date),
      durationMinutes: record?.durationMinutes != null ? String(record.durationMinutes) : "",
      description: record?.description ?? "",
    },
    validators: { onSubmit: timeEntrySchema },
    onSubmit: async ({ value }) => {
      const payload = {
        userId: value.userId,
        projectId: value.projectId,
        taskId: fixedTaskId,
        date: new Date(value.date),
        durationMinutes: Number(value.durationMinutes),
        description: value.description || null,
      };
      if (record) {
        await updateTimeEntry(record.id, payload);
        successToast("Time entry updated successfully!");
      } else {
        await createTimeEntry(payload);
        successToast("Time entry created successfully!");
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
        {users && (
          <form.Field name="userId">
            {(field) => (
              <FormSelectField field={field} label="User" placeholder="Select a user" options={users} />
            )}
          </form.Field>
        )}
        {!projectId && projects && (
          <form.Field name="projectId">
            {(field) => (
              <FormSelectField field={field} label="Project" placeholder="Select a project" options={projects} />
            )}
          </form.Field>
        )}
        <form.Field name="date">
          {(field) => <FormDateField field={field} label="Date" />}
        </form.Field>
        <form.Field name="durationMinutes">
          {(field) => <FormNumberField field={field} label="Duration (minutes)" placeholder="60" step="1" />}
        </form.Field>
        <form.Field name="description">
          {(field) => <FormTextField field={field} label="Description" placeholder="Optional notes" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
