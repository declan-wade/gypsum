"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommonModal, ModalSuccessContext } from "@/components/modal";
import { ConfirmDialog } from "@/components/confirm-dialog";

export interface RowAction {
  label: string;
  onSelect: () => unknown;
  destructive?: boolean;
  // When set, a ConfirmDialog is shown before onSelect runs, and RowActions
  // manages the pending state while onSelect's promise resolves.
  confirm?: {
    title: string;
    description?: React.ReactNode;
    confirmLabel?: string;
  };
}

interface RowActionsProps {
  // When provided, an "Edit" item opens this form in a modal; the form gets the
  // standard close-and-refresh behaviour via ModalSuccessContext.
  editTitle?: string;
  editForm?: React.ReactNode;
  // Extra menu items (e.g. Delete) — future-proofs each row for more actions.
  actions?: RowAction[];
}

export function RowActions({ editTitle, editForm, actions }: RowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<RowAction | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onEditSuccess = useCallback(() => {
    setEditOpen(false);
    router.refresh();
  }, [router]);

  const runAction = (action: RowAction) => {
    if (action.confirm) {
      setConfirmingAction(action);
      return;
    }
    action.onSelect();
  };

  const confirmAndRun = () => {
    if (!confirmingAction) return;
    startTransition(async () => {
      await confirmingAction.onSelect();
      setConfirmingAction(null);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {editForm && (
              <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit</DropdownMenuItem>
            )}
            {editForm && actions?.length ? <DropdownMenuSeparator /> : null}
            {actions?.map((action) => (
              <DropdownMenuItem
                key={action.label}
                variant={action.destructive ? "destructive" : "default"}
                onClick={() => runAction(action)}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {editForm && (
        <CommonModal open={editOpen} onOpenChange={setEditOpen} title={editTitle}>
          <ModalSuccessContext value={onEditSuccess}>{editForm}</ModalSuccessContext>
        </CommonModal>
      )}
      {confirmingAction?.confirm && (
        <ConfirmDialog
          open={!!confirmingAction}
          onOpenChange={(open) => !open && setConfirmingAction(null)}
          title={confirmingAction.confirm.title}
          description={confirmingAction.confirm.description}
          confirmLabel={confirmingAction.confirm.confirmLabel ?? "Delete"}
          pending={pending}
          onConfirm={confirmAndRun}
        />
      )}
    </>
  );
}
