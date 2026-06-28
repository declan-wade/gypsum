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
import { createTask } from "./actions";
import type { TaskStatus } from "@prisma/client";

const taskSchema = z.object({
  title: z.string().min(2, "Must be at least 2 characters.").max(200),
  projectId: z.string().min(1, "Please select a project."),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  dueDate: z.string(),
  description: z.string(),
});

const statusOptions = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DONE", label: "Done" },
];

interface TaskFormProps {
  // List page passes selectable projects; the project detail page passes a fixed id.
  projects?: { value: string; label: string }[];
  projectId?: string;
}

export function TaskForm({ projects, projectId }: TaskFormProps) {
  const onSuccess = useModalSuccess();
  const form = useForm({
    defaultValues: {
      title: "",
      projectId: projectId ?? "",
      status: "TODO" as TaskStatus,
      dueDate: "",
      description: "",
    },
    validators: { onSubmit: taskSchema },
    onSubmit: async ({ value }) => {
      await createTask({
        title: value.title,
        projectId: value.projectId,
        status: value.status,
        dueDate: value.dueDate ? new Date(value.dueDate) : null,
        description: value.description || null,
      });
      successToast("Task created successfully!");
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
        <form.Field name="title">
          {(field) => <FormTextField field={field} label="Title" placeholder="Enter task title" />}
        </form.Field>
        {!projectId && projects && (
          <form.Field name="projectId">
            {(field) => (
              <FormSelectField field={field} label="Project" placeholder="Select a project" options={projects} />
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
        <form.Field name="description">
          {(field) => <FormTextField field={field} label="Description" placeholder="Optional notes" />}
        </form.Field>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
