"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { ProjectStatus } from "@prisma/client";

export async function createProject(data: {
  name: string;
  companyId: string;
  status: ProjectStatus;
  hourlyRate: number | null;
  budget: number | null;
  startDate: Date | null;
  endDate: Date | null;
  description: string | null;
}) {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      companyId: data.companyId,
      status: data.status,
      hourlyRate: data.hourlyRate,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
    },
  });
  await logActivity({
    entityType: "Project",
    entityId: project.id,
    action: "CREATED",
    summary: `Created project ${project.name}`,
  });
}

export async function updateProject(
  id: string,
  data: {
    name: string;
    companyId: string;
    status: ProjectStatus;
    hourlyRate: number | null;
    budget: number | null;
    startDate: Date | null;
    endDate: Date | null;
    description: string | null;
  }
) {
  const project = await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      companyId: data.companyId,
      status: data.status,
      hourlyRate: data.hourlyRate,
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
    },
  });
  await logActivity({
    entityType: "Project",
    entityId: id,
    action: "UPDATED",
    summary: `Updated project ${project.name}`,
  });
}
