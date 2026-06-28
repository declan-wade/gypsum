"use server";

import { prisma } from "@/lib/prisma";

export async function createTimeEntry(data: {
  userId: string;
  projectId: string;
  taskId: string | null;
  date: Date;
  durationMinutes: number;
  description: string | null;
}) {
  await prisma.timeEntry.create({
    data: {
      userId: data.userId,
      projectId: data.projectId,
      taskId: data.taskId,
      date: data.date,
      durationMinutes: data.durationMinutes,
      description: data.description,
    },
  });
}
