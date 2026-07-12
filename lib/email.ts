import "server-only";

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { isPortalUserId, listStaffUsers } from "@/lib/auth/users";
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
const FROM = domain ? `Gypsum <notifications@${domain}>` : null;

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

/** Staff users who want a given broadcast notification (default on). Portal
 * client accounts are never included — internal CRM mail must not reach them. */
async function recipientsFor(pref: NotificationPref): Promise<Recipient[]> {
  const [users, allSettings] = await Promise.all([
    listStaffUsers(),
    prisma.notificationSettings.findMany(),
  ]);
  const byId = new Map(allSettings.map((s) => [s.userId, s]));
  return users
    .filter((u) => u.email && prefEnabled(byId.get(u.id), pref))
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

/** A single auth user, if they want a given targeted notification. Portal
 * client accounts never receive internal notifications. */
async function recipientIfEnabled(
  userId: string,
  pref: NotificationPref
): Promise<Recipient | null> {
  const [rows, settings, isClient] = await Promise.all([
    prisma.$queryRaw<{ email: string; name: string }[]>`
      SELECT email, name FROM neon_auth."user" WHERE id = ${userId} LIMIT 1
    `,
    prisma.notificationSettings.findUnique({ where: { userId } }),
    isPortalUserId(userId),
  ]);
  const user = rows[0];
  if (isClient || !user?.email || !prefEnabled(settings, pref)) return null;
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
    text: `Hi ${recipient.name},\n\nYou've been assigned a task: ${params.title}${project}${due}\n\n— Gypsum`,
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
        text: `Hi ${r.name},\n\nInvoice ${params.number}${total} has been sent${company}.\n\n— Gypsum`,
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
    text: `Hi ${recipient.name},\n\nThe following tasks are due soon:\n\n${lines}\n\n— Gypsum`,
  });
}

/** Broadcast to every staff user with an email — for workflow notifications
 * that don't (yet) have a per-user preference toggle. Portal clients excluded. */
async function broadcast(subject: string, body: string): Promise<void> {
  const users = await listStaffUsers();
  const recipients = users.filter((u) => u.email);
  await Promise.all(
    recipients.map((u) =>
      sendEmail({
        to: u.email,
        subject,
        text: `Hi ${u.name},\n\n${body}\n\n— Gypsum`,
      })
    )
  );
}

/** A sent quote has gone quiet — nudge the team to follow up. */
export async function notifyQuoteFollowUp(params: {
  number: string;
  companyName?: string | null;
  total?: string | null;
  daysSinceSent: number;
}): Promise<void> {
  const company = params.companyName ? ` for ${params.companyName}` : "";
  const total = params.total ? ` (${params.total})` : "";
  await broadcast(
    `Quote ${params.number} needs a follow-up`,
    `Quote ${params.number}${total}${company} was sent ${params.daysSinceSent} days ago and hasn't been accepted or rejected yet. It might be worth a follow-up.`
  );
}

/** A quote passed its expiry date and was auto-expired. */
export async function notifyQuoteExpired(params: {
  number: string;
  companyName?: string | null;
}): Promise<void> {
  const company = params.companyName ? ` for ${params.companyName}` : "";
  await broadcast(
    `Quote ${params.number} has expired`,
    `Quote ${params.number}${company} passed its expiry date without a response and has been marked Expired.`
  );
}

/** An open deal has sat in the same stage for too long. */
export async function notifyDealStale(params: {
  title: string;
  companyName?: string | null;
  stage: string;
  staleDays: number;
  value?: string | null;
}): Promise<void> {
  const company = params.companyName ? ` (${params.companyName})` : "";
  const value = params.value ? ` worth ${params.value}` : "";
  await broadcast(
    `Deal going stale: ${params.title}`,
    `The deal "${params.title}"${company}${value} has been sitting in ${params.stage} for ${params.staleDays} days without movement.`
  );
}

/** An active project's end date is approaching. */
export async function notifyProjectDeadline(params: {
  name: string;
  companyName?: string | null;
  endDate: Date;
  leadDays: number;
}): Promise<void> {
  const company = params.companyName ? ` for ${params.companyName}` : "";
  await broadcast(
    `Project deadline approaching: ${params.name}`,
    `The project "${params.name}"${company} is due on ${params.endDate.toLocaleDateString()} — ${params.leadDays} days from now.`
  );
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
        text: `Hi ${r.name},\n\nThe following invoices are now overdue:\n\n${lines}\n\n— Gypsum`,
      })
    )
  );
}

export { recipientsFor, recipientIfEnabled };
