"use server";

import { prisma } from "@/lib/prisma";
import type { DealStage } from "@prisma/client";

export async function createDeal(data: {
  title: string;
  value: number;
  stage: DealStage;
  companyId: string;
  expectedCloseDate: Date | null;
}) {
  await prisma.deal.create({
    data: {
      title: data.title,
      value: data.value,
      stage: data.stage,
      companyId: data.companyId,
      expectedCloseDate: data.expectedCloseDate,
    },
  });
}
