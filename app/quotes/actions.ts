"use server";

import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
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
}
