"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { notifyTaskAssigned } from "@/lib/email";
import type { TaskStatus } from "@prisma/client";

export async function createTask(data: {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: Date | null;
  projectId: string;
  assigneeId: string | null;
}) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
    },
    include: { project: { select: { name: true } } },
  });
  await logActivity({
    entityType: "Task",
    entityId: task.id,
    action: "CREATED",
    summary: `Created task ${task.title}`,
  });
  if (task.assigneeId) {
    await notifyTaskAssigned({
      assigneeId: task.assigneeId,
      title: task.title,
      dueDate: task.dueDate,
      projectName: task.project.name,
    });
  }
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
    assigneeId: string | null;
  }
) {
  const previous = await prisma.task.findUnique({
    where: { id },
    select: { assigneeId: true },
  });

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      dueDate: data.dueDate,
      projectId: data.projectId,
      assigneeId: data.assigneeId,
    },
    include: { project: { select: { name: true } } },
  });
  await logActivity({
    entityType: "Task",
    entityId: id,
    action: "UPDATED",
    summary: `Updated task ${task.title}`,
  });
  // Only notify when the assignee actually changes to a new person.
  if (task.assigneeId && task.assigneeId !== previous?.assigneeId) {
    await notifyTaskAssigned({
      assigneeId: task.assigneeId,
      title: task.title,
      dueDate: task.dueDate,
      projectName: task.project.name,
    });
  }
  revalidatePath(`/projects/${data.projectId}`);
}

export async function deleteTask(id: string) {
  const task = await prisma.task.delete({
    where: { id },
    select: { title: true, projectId: true },
  });
  await logActivity({
    entityType: "Task",
    entityId: id,
    action: "DELETED",
    summary: `Deleted task ${task.title}`,
  });
  revalidatePath("/tasks");
  revalidatePath("/my-tasks");
  revalidatePath(`/projects/${task.projectId}`);
}
