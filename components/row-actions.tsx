"use client";

import { useCallback, useState } from "react";
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

export interface RowAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
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
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onSuccess = useCallback(() => {
    setOpen(false);
    router.refresh();
  }, [router]);

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
              <DropdownMenuItem onClick={() => setOpen(true)}>Edit</DropdownMenuItem>
            )}
            {editForm && actions?.length ? <DropdownMenuSeparator /> : null}
            {actions?.map((action) => (
              <DropdownMenuItem
                key={action.label}
                variant={action.destructive ? "destructive" : "default"}
                onClick={action.onSelect}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {editForm && (
        <CommonModal open={open} onOpenChange={setOpen} title={editTitle}>
          <ModalSuccessContext value={onSuccess}>{editForm}</ModalSuccessContext>
        </CommonModal>
      )}
    </>
  );
}
