import { NextResponse, type NextRequest } from "next/server";
import { sendDueSoonTaskReminders } from "@/lib/task-reminders";

// Scheduled (Vercel Cron) endpoint to email assignees about tasks due soon.
// Vercel sets `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is configured.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await sendDueSoonTaskReminders();
  return NextResponse.json({ ok: true, remindersSent: count });
}
