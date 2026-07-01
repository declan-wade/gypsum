import "server-only";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { listAuthUsers } from "@/lib/auth/users";
import type { NotificationSettings } from "@prisma/client";

// Which per-user boolean toggle controls a given notification.
type NotificationPref = keyof Pick<
  NotificationSettings,
  "taskAssigned" | "taskDueSoon" | "invoiceSent" | "invoiceOverdue"
>;

const apiKey = process.env.RESEND_API_KEY;
const domain = process.env.RESEND_DOMAIN;

// Instantiate lazily so a missing key degrades gracefully instead of throwing
// at import time (e.g. in local dev without Resend configured).
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = domain ? `CRM NGX <notifications@${domain}>` : null;

interface Recipient {
  id: string;
  name: string;
  email: string;
}

/**
 * Send an email via Resend. Never throws — notification failures should not
 * break the user action that triggered them. Returns whether it was sent.
 */
async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  if (!resend || !FROM) {
    console.warn(
      "[email] RESEND_API_KEY / RESEND_DOMAIN not set — skipping email:",
      params.subject
    );
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
    if (error) {
      console.error("[email] send failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send threw:", err);
    return false;
  }
}

// A pref is "on" when the user has no settings row (defaults) or has it enabled.
function prefEnabled(
  settings: NotificationSettings | null | undefined,
  pref: NotificationPref
): boolean {
  return settings ? settings[pref] : true;
}

/** Auth users who want a given broadcast notification (default on). */
async function recipientsFor(pref: NotificationPref): Promise<Recipient[]> {
  const [users, allSettings] = await Promise.all([
    listAuthUsers(),
    prisma.notificationSettings.findMany(),
  ]);
  const byId = new Map(allSettings.map((s) => [s.userId, s]));
  return users
    .filter((u) => u.email && prefEnabled(byId.get(u.id), pref))
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

/** A single auth user, if they want a given targeted notification. */
async function recipientIfEnabled(
  userId: string,
  pref: NotificationPref
): Promise<Recipient | null> {
  const [rows, settings] = await Promise.all([
    prisma.$queryRaw<{ email: string; name: string }[]>`
      SELECT email, name FROM neon_auth."user" WHERE id = ${userId} LIMIT 1
    `,
    prisma.notificationSettings.findUnique({ where: { userId } }),
  ]);
  const user = rows[0];
  if (!user?.email || !prefEnabled(settings, pref)) return null;
  return { id: userId, name: user.name, email: user.email };
}

// ---------------------------------------------------------------------------
// Notification senders — one per event. Each is safe to call from a server
// action; they resolve recipients, check prefs, and send (best-effort).
// ---------------------------------------------------------------------------

/** Task was assigned to `assigneeId` — notify that user (targeted). */
export async function notifyTaskAssigned(params: {
  assigneeId: string;
  title: string;
  dueDate: Date | null;
  projectName?: string | null;
}): Promise<void> {
  const recipient = await recipientIfEnabled(params.assigneeId, "taskAssigned");
  if (!recipient) return;

  const due = params.dueDate
    ? `\nDue: ${params.dueDate.toLocaleDateString()}`
    : "";
  const project = params.projectName ? `\nProject: ${params.projectName}` : "";

  await sendEmail({
    to: recipient.email,
    subject: `Task assigned to you: ${params.title}`,
    text: `Hi ${recipient.name},\n\nYou've been assigned a task: ${params.title}${project}${due}\n\n— CRM NGX`,
  });
}

/** Invoice was sent — broadcast to everyone who opted in. */
export async function notifyInvoiceSent(params: {
  number: string;
  companyName?: string | null;
  total?: string | null;
}): Promise<void> {
  const recipients = await recipientsFor("invoiceSent");
  if (recipients.length === 0) return;

  const company = params.companyName ? ` to ${params.companyName}` : "";
  const total = params.total ? ` (${params.total})` : "";

  await Promise.all(
    recipients.map((r) =>
      sendEmail({
        to: r.email,
        subject: `Invoice ${params.number} sent`,
        text: `Hi ${r.name},\n\nInvoice ${params.number}${total} has been sent${company}.\n\n— CRM NGX`,
      })
    )
  );
}

/** One or more of a user's tasks are due soon — notify that user (targeted). */
export async function notifyTaskDueSoon(params: {
  assigneeId: string;
  tasks: { title: string; dueDate: Date | null }[];
}): Promise<void> {
  const recipient = await recipientIfEnabled(params.assigneeId, "taskDueSoon");
  if (!recipient || params.tasks.length === 0) return;

  const lines = params.tasks
    .map(
      (t) =>
        `• ${t.title}${t.dueDate ? ` — due ${t.dueDate.toLocaleDateString()}` : ""}`
    )
    .join("\n");

  await sendEmail({
    to: recipient.email,
    subject:
      params.tasks.length === 1
        ? `Task due soon: ${params.tasks[0].title}`
        : `${params.tasks.length} tasks due soon`,
    text: `Hi ${recipient.name},\n\nThe following tasks are due soon:\n\n${lines}\n\n— CRM NGX`,
  });
}

/** Invoices just became overdue — broadcast a digest to everyone opted in. */
export async function notifyInvoicesOverdue(
  invoices: { number: string; companyName?: string | null; total?: string | null }[]
): Promise<void> {
  if (invoices.length === 0) return;
  const recipients = await recipientsFor("invoiceOverdue");
  if (recipients.length === 0) return;

  const lines = invoices
    .map(
      (i) =>
        `• ${i.number}${i.companyName ? ` — ${i.companyName}` : ""}${i.total ? ` (${i.total})` : ""}`
    )
    .join("\n");

  await Promise.all(
    recipients.map((r) =>
      sendEmail({
        to: r.email,
        subject:
          invoices.length === 1
            ? `Invoice ${invoices[0].number} is overdue`
            : `${invoices.length} invoices are overdue`,
        text: `Hi ${r.name},\n\nThe following invoices are now overdue:\n\n${lines}\n\n— CRM NGX`,
      })
    )
  );
}

export { recipientsFor, recipientIfEnabled };
