"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { DealStage } from "@prisma/client";

export async function createDeal(data: {
  title: string;
  value: number;
  stage: DealStage;
  companyId: string;
  expectedCloseDate: Date | null;
}) {
  const deal = await prisma.deal.create({
    data: {
      title: data.title,
      value: data.value,
      stage: data.stage,
      companyId: data.companyId,
      expectedCloseDate: data.expectedCloseDate,
    },
  });
  await logActivity({
    entityType: "Deal",
    entityId: deal.id,
    action: "CREATED",
    summary: `Created deal ${deal.title}`,
  });
}

export async function updateDealStage(id: string, stage: DealStage) {
  const deal = await prisma.deal.update({
    where: { id },
    data: { stage },
  });
  await logActivity({
    entityType: "Deal",
    entityId: id,
    action: "UPDATED",
    summary: `Moved deal ${deal.title} to ${stage}`,
  });
}

export async function updateDeal(
  id: string,
  data: {
    title: string;
    value: number;
    stage: DealStage;
    companyId: string;
    expectedCloseDate: Date | null;
  }
) {
  const deal = await prisma.deal.update({
    where: { id },
    data: {
      title: data.title,
      value: data.value,
      stage: data.stage,
      companyId: data.companyId,
      expectedCloseDate: data.expectedCloseDate,
    },
  });
  await logActivity({
    entityType: "Deal",
    entityId: id,
    action: "UPDATED",
    summary: `Updated deal ${deal.title}`,
  });
}
