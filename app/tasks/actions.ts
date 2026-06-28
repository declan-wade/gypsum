"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";

export async function createTask(data: {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  projectId: string;
}) {
  await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate,
      projectId: data.projectId,
    },
  });
  revalidatePath(`/projects/${data.projectId}`);
}
