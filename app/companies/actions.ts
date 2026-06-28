"use server";

import { prisma } from "@/lib/prisma";
import { CompanyStatus } from "@prisma/client/edge";

export async function createCompany(data: {
  name: string;
  website: string;
  industry: string;
  status: CompanyStatus;
}) {
  await prisma.company.create({
    data: {
      name: data.name,
      website: data.website,
      industry: data.industry,
      status: data.status,
    },
  });
}
