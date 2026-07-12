import { sleep } from "workflow";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { notifyQuoteExpired, notifyQuoteFollowUp } from "@/lib/email";
import { formatMoney } from "@/lib/format";
import { getWorkflowConfig } from "@/lib/workflow-config";

const DAY_MS = 86_400_000;

// One instance runs per quote from the moment it's sent. Every
// `followUpDays` it wakes up: if the quote has been accepted/rejected it
// stops; if the expiry date has passed (and auto-expire is on) it marks the
// quote Expired and stops; otherwise it emails a follow-up nudge, up to
// `maxFollowUps` times. Config is re-read at every wake, so settings changes
// apply to in-flight runs.
export async function trackQuoteFollowUp(quoteId: string) {
  "use workflow";

  const initial = await getQuoteState(quoteId);
  if (!initial.config.enabled) {
    return { quoteId, outcome: "disabled" as const };
  }
  if (!initial.quote || initial.quote.status !== "SENT") {
    return { quoteId, outcome: "skipped" as const };
  }

  for (let followUp = 1; ; followUp++) {
    const beforeSleep = await getQuoteState(quoteId);
    if (!beforeSleep.config.enabled) {
      return { quoteId, outcome: "disabled" as const };
    }

    await sleep(beforeSleep.config.followUpDays * DAY_MS);

    const state = await getQuoteState(quoteId);
    if (!state.quote || state.quote.status !== "SENT") {
      return { quoteId, outcome: "resolved" as const, followUp };
    }
    if (!state.config.enabled) {
      return { quoteId, outcome: "disabled" as const };
    }

    if (
      state.config.autoExpire &&
      state.quote.expiryDate &&
      new Date(state.quote.expiryDate).getTime() < Date.now()
    ) {
      await expireQuote(quoteId);
      return { quoteId, outcome: "expired" as const, followUp };
    }

    if (followUp > state.config.maxFollowUps) {
      return { quoteId, outcome: "follow-ups-exhausted" as const };
    }

    await sendFollowUp(quoteId, followUp * state.config.followUpDays);
  }
}

async function getQuoteState(quoteId: string) {
  "use step";
  const [quote, config] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: quoteId },
      select: { status: true, expiryDate: true },
    }),
    getWorkflowConfig("quote-follow-up"),
  ]);
  return {
    quote,
    config: {
      enabled: config.enabled,
      followUpDays: Number(config.settings.followUpDays ?? 3),
      maxFollowUps: Number(config.settings.maxFollowUps ?? 2),
      autoExpire: Boolean(config.settings.autoExpire ?? true),
    },
  };
}

async function sendFollowUp(quoteId: string, daysSinceSent: number) {
  "use step";
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { number: true, total: true, company: { select: { name: true } } },
  });
  if (!quote) return;

  await notifyQuoteFollowUp({
    number: quote.number,
    companyName: quote.company.name,
    total: formatMoney(quote.total.toString()),
    daysSinceSent,
  });
}

async function expireQuote(quoteId: string) {
  "use step";
  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "EXPIRED" },
    select: { number: true, company: { select: { name: true } } },
  });

  await logActivity({
    entityType: "Quote",
    entityId: quoteId,
    action: "UPDATED",
    summary: `Quote ${quote.number} auto-expired`,
    userId: null,
  });
  await notifyQuoteExpired({
    number: quote.number,
    companyName: quote.company.name,
  });
}
