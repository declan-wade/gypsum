"use server";

import { start } from "workflow/api";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { isWorkflowEnabled } from "@/lib/workflow-config";
import { trackDealStale } from "@/workflows/deal-stale";
import type { DealStage } from "@prisma/client";

// Starts a stale-deal watch for the deal's current stage. Any previous watch
// exits on wake when it sees the stage changed.
async function watchDealStaleness(dealId: string, stage: DealStage) {
  if (["WON", "LOST"].includes(stage)) return;
  if (!(await isWorkflowEnabled("deal-stale"))) return;
  await start(trackDealStale, [dealId]);
}

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
  await watchDealStaleness(deal.id, deal.stage);
}

export async function updateDealStage(id: string, stage: DealStage) {
  const previous = await prisma.deal.findUnique({
    where: { id },
    select: { stage: true },
  });
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
  if (previous?.stage !== deal.stage) {
    await watchDealStaleness(id, deal.stage);
  }
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
  const previous = await prisma.deal.findUnique({
    where: { id },
    select: { stage: true },
  });
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
  if (previous?.stage !== deal.stage) {
    await watchDealStaleness(id, deal.stage);
  }
}
