"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { CompanyStatus } from "@prisma/client/edge";

export async function createCompany(data: {
  name: string;
  website: string;
  industry: string;
  status: CompanyStatus;
}) {
  const company = await prisma.company.create({
    data: {
      name: data.name,
      website: data.website,
      industry: data.industry,
      status: data.status,
    },
  });
  await logActivity({
    entityType: "Company",
    entityId: company.id,
    action: "CREATED",
    summary: `Created company ${company.name}`,
  });
}

export async function updateCompany(
  id: string,
  data: {
    name: string;
    website: string;
    industry: string;
    status: CompanyStatus;
  }
) {
  const company = await prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      website: data.website,
      industry: data.industry,
      status: data.status,
    },
  });
  await logActivity({
    entityType: "Company",
    entityId: id,
    action: "UPDATED",
    summary: `Updated company ${company.name}`,
  });
}
