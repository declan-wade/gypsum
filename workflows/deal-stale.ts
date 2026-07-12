import { sleep } from "workflow";
import { prisma } from "@/lib/prisma";
import { notifyDealStale } from "@/lib/email";
import { formatMoney } from "@/lib/format";
import { getWorkflowConfig } from "@/lib/workflow-config";

const DAY_MS = 86_400_000;

// One instance runs per deal each time it's created or changes stage. It
// captures the stage it started in, sleeps `staleDays`, and nudges the team
// if the deal is still sitting in that same stage. A stage change starts a
// fresh run, and this one exits quietly at wake time — so there's never more
// than one relevant nudge pending per deal.
export async function trackDealStale(dealId: string) {
  "use workflow";

  const initial = await getDealState(dealId);
  if (!initial.config.enabled) {
    return { dealId, outcome: "disabled" as const };
  }
  if (!initial.deal || ["WON", "LOST"].includes(initial.deal.stage)) {
    return { dealId, outcome: "skipped" as const };
  }

  const watchedStage = initial.deal.stage;
  await sleep(initial.config.staleDays * DAY_MS);

  const state = await getDealState(dealId);
  if (!state.config.enabled) {
    return { dealId, outcome: "disabled" as const };
  }
  if (!state.deal || state.deal.stage !== watchedStage) {
    return { dealId, outcome: "progressed" as const };
  }

  await sendStaleNudge(dealId, state.config.staleDays);
  return { dealId, outcome: "nudged" as const, stage: watchedStage };
}

async function getDealState(dealId: string) {
  "use step";
  const [deal, config] = await Promise.all([
    prisma.deal.findUnique({
      where: { id: dealId },
      select: { stage: true },
    }),
    getWorkflowConfig("deal-stale"),
  ]);
  return {
    deal,
    config: {
      enabled: config.enabled,
      staleDays: Number(config.settings.staleDays ?? 14),
    },
  };
}

async function sendStaleNudge(dealId: string, staleDays: number) {
  "use step";
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      title: true,
      stage: true,
      value: true,
      company: { select: { name: true } },
    },
  });
  if (!deal) return;

  await notifyDealStale({
    title: deal.title,
    companyName: deal.company.name,
    stage: deal.stage,
    staleDays,
    value: formatMoney(deal.value.toString()),
  });
}
