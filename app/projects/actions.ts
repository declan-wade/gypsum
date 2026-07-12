"use server";

import { start } from "workflow/api";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { isWorkflowEnabled } from "@/lib/workflow-config";
import { trackProjectDeadline } from "@/workflows/project-deadline";
import type { ProjectStatus } from "@prisma/client";

// Starts a deadline watch for an active project's end date. A previous watch
// for an older end date exits on wake when it sees the date changed.
async function watchProjectDeadline(
  projectId: string,
  status: ProjectStatus,
  endDate: Date | null
) {
  if (status !== "ACTIVE" || !endDate) return;
  if (!(await isWorkflowEnabled("project-deadline"))) return;
  await start(trackProjectDeadline, [projectId]);
}

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
  await watchProjectDeadline(project.id, project.status, project.endDate);
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
  const previous = await prisma.project.findUnique({
    where: { id },
    select: { endDate: true },
  });
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
  // Only start a new watch when the end date actually changes; the old watch
  // exits on its own once it sees the date no longer matches.
  if (previous?.endDate?.getTime() !== project.endDate?.getTime()) {
    await watchProjectDeadline(id, project.status, project.endDate);
  }
}
