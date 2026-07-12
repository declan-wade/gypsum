"use server";

import { start } from "workflow/api";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { isWorkflowEnabled } from "@/lib/workflow-config";
import { trackQuoteFollowUp } from "@/workflows/quote-follow-up";
import type { QuoteStatus } from "@prisma/client";

export async function createQuote(data: {
  number: string;
  status: QuoteStatus;
  companyId: string;
  expiryDate: Date | null;
  notes: string | null;
}) {
  const quote = await prisma.quote.create({
    data: {
      number: data.number,
      status: data.status,
      companyId: data.companyId,
      expiryDate: data.expiryDate,
      notes: data.notes,
    },
  });
  await logActivity({
    entityType: "Quote",
    entityId: quote.id,
    action: "CREATED",
    summary: `Created quote ${quote.number}`,
  });
  if (quote.status === "SENT" && (await isWorkflowEnabled("quote-follow-up"))) {
    await start(trackQuoteFollowUp, [quote.id]);
  }
}

export async function updateQuote(
  id: string,
  data: {
    number: string;
    status: QuoteStatus;
    companyId: string;
    expiryDate: Date | null;
    notes: string | null;
  }
) {
  const previous = await prisma.quote.findUnique({
    where: { id },
    select: { status: true },
  });

  const quote = await prisma.quote.update({
    where: { id },
    data: {
      number: data.number,
      status: data.status,
      companyId: data.companyId,
      expiryDate: data.expiryDate,
      notes: data.notes,
    },
  });
  await logActivity({
    entityType: "Quote",
    entityId: id,
    action: "UPDATED",
    summary: `Updated quote ${quote.number}`,
  });
  // Only start the follow-up tracker on the transition into SENT, not on
  // every save of a sent quote.
  if (
    quote.status === "SENT" &&
    previous?.status !== "SENT" &&
    (await isWorkflowEnabled("quote-follow-up"))
  ) {
    await start(trackQuoteFollowUp, [id]);
  }
}
