"use client";

import { useForm } from "@tanstack/react-form";
import { FieldGroup, FieldSet, FieldLegend } from "@/components/ui/field";
import { FormSwitchField, FormActions } from "@/components/form-fields";
import { successToast, errorToast } from "@/lib/toast";
import { updateNotificationSettings } from "./actions";

export interface NotificationSettingsRecord {
  taskAssigned: boolean;
  taskDueSoon: boolean;
  invoiceSent: boolean;
  invoiceOverdue: boolean;
}

export function NotificationSettingsForm({
  record,
}: {
  record: NotificationSettingsRecord;
}) {
  const form = useForm({
    defaultValues: {
      taskAssigned: record.taskAssigned,
      taskDueSoon: record.taskDueSoon,
      invoiceSent: record.invoiceSent,
      invoiceOverdue: record.invoiceOverdue,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateNotificationSettings(value);
        successToast("Notification settings saved!");
      } catch (err) {
        errorToast(
          err instanceof Error ? err.message : "Failed to save settings."
        );
      }
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
        <FieldSet>
          <FieldLegend>Tasks</FieldLegend>
          <form.Field name="taskAssigned">
            {(field) => (
              <FormSwitchField
                field={field}
                label="Assigned to me"
                description="Email me when a task is assigned to me."
              />
            )}
          </form.Field>
          <form.Field name="taskDueSoon">
            {(field) => (
              <FormSwitchField
                field={field}
                label="Due soon"
                description="Email me when one of my tasks is due soon."
              />
            )}
          </form.Field>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Invoices</FieldLegend>
          <form.Field name="invoiceSent">
            {(field) => (
              <FormSwitchField
                field={field}
                label="Sent"
                description="Email me when an invoice is sent."
              />
            )}
          </form.Field>
          <form.Field name="invoiceOverdue">
            {(field) => (
              <FormSwitchField
                field={field}
                label="Overdue"
                description="Email me when an invoice becomes overdue."
              />
            )}
          </form.Field>
        </FieldSet>
      </FieldGroup>
      <FormActions />
    </form>
  );
}
