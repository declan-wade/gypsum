"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { TaskStatus } from "@prisma/client";

export async function createTask(data: {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  projectId: string;
}) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate,
      projectId: data.projectId,
    },
  });
  await logActivity({
    entityType: "Task",
    entityId: task.id,
    action: "CREATED",
    summary: `Created task ${task.title}`,
  });
  revalidatePath(`/projects/${data.projectId}`);
}

export async function updateTask(
  id: string,
  data: {
    title: string;
    description: string | null;
    status: TaskStatus;
    dueDate: Date | null;
    projectId: string;
  }
) {
  const task = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate,
      projectId: data.projectId,
    },
  });
  await logActivity({
    entityType: "Task",
    entityId: id,
    action: "UPDATED",
    summary: `Updated task ${task.title}`,
  });
  revalidatePath(`/projects/${data.projectId}`);
}
