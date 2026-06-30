import { NextResponse, type NextRequest } from "next/server";
import { markOverdueInvoices } from "@/lib/invoice-ar";

// Scheduled (Vercel Cron) endpoint to flag overdue invoices.
// Vercel sets `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is configured.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await markOverdueInvoices();
  return NextResponse.json({ ok: true, markedOverdue: count });
}
