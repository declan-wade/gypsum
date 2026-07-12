// Registry of every automation in the app — durable workflows, cron sweeps and
// inline notifications alike — with the settings each one exposes. This is the
// single source of truth the Workflows page renders and lib/workflow-config.ts
// merges stored overrides into. Client-safe: no server imports.

export type WorkflowSettingValue = number | boolean;

export interface NumberFieldDef {
  key: string;
  label: string;
  description: string;
  type: "number";
  unit: "days" | "hours" | "times";
  default: number;
  min: number;
  max: number;
}

export interface BooleanFieldDef {
  key: string;
  label: string;
  description: string;
  type: "boolean";
  default: boolean;
}

export type WorkflowFieldDef = NumberFieldDef | BooleanFieldDef;

export interface WorkflowDef {
  key: string;
  name: string;
  description: string;
  /** Human description of what starts it, e.g. "When an invoice is marked Sent". */
  trigger: string;
  /** How it executes — shown as a hint chip on the automation card. */
  engine: "workflow" | "cron" | "inline";
  category: "Finance" | "Sales" | "Delivery";
  fields: WorkflowFieldDef[];
}

export const WORKFLOW_REGISTRY: WorkflowDef[] = [
  {
    key: "invoice-overdue",
    name: "Invoice overdue tracking",
    description:
      "Waits until an invoice's due date, flags it overdue if unpaid, then emails a reminder digest on a schedule until it is paid or resolved. The daily sweep backstop is governed by the same switch.",
    trigger: "When an invoice is marked Sent",
    engine: "workflow",
    category: "Finance",
    fields: [
      {
        key: "reminderIntervalDays",
        label: "Reminder interval",
        description: "Days between overdue reminder emails.",
        type: "number",
        unit: "days",
        default: 7,
        min: 1,
        max: 90,
      },
      {
        key: "maxReminders",
        label: "Maximum reminders",
        description: "Reminders sent per invoice before giving up.",
        type: "number",
        unit: "times",
        default: 4,
        min: 0,
        max: 20,
      },
    ],
  },
  {
    key: "quote-follow-up",
    name: "Quote follow-up & expiry",
    description:
      "Nudges the team about quotes that have been sitting in Sent, and optionally marks quotes Expired once their expiry date passes.",
    trigger: "When a quote is marked Sent",
    engine: "workflow",
    category: "Sales",
    fields: [
      {
        key: "followUpDays",
        label: "Follow-up after",
        description: "Days a quote can sit in Sent before a follow-up email.",
        type: "number",
        unit: "days",
        default: 3,
        min: 1,
        max: 60,
      },
      {
        key: "maxFollowUps",
        label: "Maximum follow-ups",
        description: "Follow-up emails sent per quote before giving up.",
        type: "number",
        unit: "times",
        default: 2,
        min: 0,
        max: 10,
      },
      {
        key: "autoExpire",
        label: "Auto-expire quotes",
        description:
          "Mark quotes Expired automatically once their expiry date passes.",
        type: "boolean",
        default: true,
      },
    ],
  },
  {
    key: "deal-stale",
    name: "Stale deal nudge",
    description:
      "Emails the team when an open deal has sat in the same stage for too long, so pipeline doesn't quietly rot.",
    trigger: "When a deal is created or changes stage",
    engine: "workflow",
    category: "Sales",
    fields: [
      {
        key: "staleDays",
        label: "Stale after",
        description: "Days a deal can sit in one stage before a nudge.",
        type: "number",
        unit: "days",
        default: 14,
        min: 1,
        max: 180,
      },
    ],
  },
  {
    key: "project-deadline",
    name: "Project deadline reminder",
    description:
      "Emails the team ahead of an active project's end date so deadlines don't arrive unannounced.",
    trigger: "When a project gains or changes its end date",
    engine: "workflow",
    category: "Delivery",
    fields: [
      {
        key: "leadDays",
        label: "Remind before",
        description: "Days before the end date to send the reminder.",
        type: "number",
        unit: "days",
        default: 7,
        min: 1,
        max: 60,
      },
    ],
  },
  {
    key: "task-due-soon",
    name: "Task due-soon reminders",
    description:
      "Daily digest emailing each assignee their tasks that fall due within the window. Each task is reminded at most once.",
    trigger: "Daily at 07:00 (cron)",
    engine: "cron",
    category: "Delivery",
    fields: [
      {
        key: "windowHours",
        label: "Due window",
        description: "How far ahead to look for due tasks.",
        type: "number",
        unit: "hours",
        default: 24,
        min: 1,
        max: 168,
      },
    ],
  },
  {
    key: "invoice-sent-notification",
    name: "Invoice sent notification",
    description:
      "Emails everyone who opted in whenever an invoice is marked Sent.",
    trigger: "When an invoice is marked Sent",
    engine: "inline",
    category: "Finance",
    fields: [],
  },
  {
    key: "task-assigned-notification",
    name: "Task assigned notification",
    description:
      "Emails a user when a task is assigned to them (respects their personal notification settings).",
    trigger: "When a task is assigned",
    engine: "inline",
    category: "Delivery",
    fields: [],
  },
];

export function getWorkflowDef(key: string): WorkflowDef | undefined {
  return WORKFLOW_REGISTRY.find((def) => def.key === key);
}

export function defaultSettings(
  def: WorkflowDef
): Record<string, WorkflowSettingValue> {
  return Object.fromEntries(def.fields.map((f) => [f.key, f.default]));
}
