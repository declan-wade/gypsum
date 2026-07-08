"use client";

import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { ConfirmButton } from "@/components/confirm-button";
import { successToast } from "@/lib/toast";
import { deleteTask } from "@/app/tasks/actions";

export function DeleteTaskButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();

  return (
    <ConfirmButton
      label="Delete"
      icon={<Trash2Icon />}
      title="Delete task?"
      description={`"${title}" will be permanently deleted. This can't be undone.`}
      confirmLabel="Delete"
      onConfirm={() => deleteTask(id)}
      onSuccess={() => {
        successToast("Task deleted.");
        router.push("/tasks");
      }}
    />
  );
}
