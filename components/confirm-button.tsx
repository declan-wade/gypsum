"use client";

import * as React from "react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ConfirmButtonProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onSuccess?: () => void;
}

// A button that opens a ConfirmDialog before running an async action, instead
// of firing immediately. Drop-in replacement for a plain delete/destructive
// Button anywhere outside a table row (detail-page headers, cards, etc.) — for
// table rows, pass `confirm` to a RowAction in RowActions instead.
export function ConfirmButton({
  label,
  icon,
  variant = "outline",
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
  onConfirm,
  onSuccess,
}: ConfirmButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {icon}
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        destructive={destructive}
        pending={pending}
        onConfirm={() =>
          startTransition(async () => {
            await onConfirm();
            setOpen(false);
            onSuccess?.();
          })
        }
      />
    </>
  );
}
