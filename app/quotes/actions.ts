"use server";

import { prisma } from "@/lib/prisma";
import type { QuoteStatus } from "@prisma/client";

export async function createQuote(data: {
  number: string;
  status: QuoteStatus;
  companyId: string;
  expiryDate: Date | null;
  notes: string | null;
}) {
  await prisma.quote.create({
    data: {
      number: data.number,
      status: data.status,
      companyId: data.companyId,
      expiryDate: data.expiryDate,
      notes: data.notes,
    },
  });
}
