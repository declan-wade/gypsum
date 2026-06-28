"use server";

import { prisma } from "@/lib/prisma";
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
  await prisma.project.create({
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
}
