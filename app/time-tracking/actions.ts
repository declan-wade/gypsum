"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function createTimeEntry(data: {
  userId: string;
  projectId: string;
  taskId: string | null;
  date: Date;
  durationMinutes: number;
  description: string | null;
}) {
  const entry = await prisma.timeEntry.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      date: data.date,
      durationMinutes: data.durationMinutes,
      description: data.description,
    },
  });
  await logActivity({
    entityType: "TimeEntry",
    entityId: entry.id,
    action: "CREATED",
    summary: `Logged ${data.durationMinutes} minutes`,
  });
}

export async function updateTimeEntry(
  id: string,
  data: {
    userId: string;
    projectId: string;
    taskId: string | null;
    date: Date;
    durationMinutes: number;
    description: string | null;
  }
) {
  await prisma.timeEntry.update({
    where: { id },
    data: {
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      date: data.date,
      durationMinutes: data.durationMinutes,
      description: data.description,
    },
  });
  await logActivity({
    entityType: "TimeEntry",
    entityId: id,
    action: "UPDATED",
    summary: `Updated time entry (${data.durationMinutes} minutes)`,
  });
}
