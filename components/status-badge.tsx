"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Tone = "green" | "amber" | "red" | "blue" | "purple" | "gray"

const toneClasses: Record<Tone, string> = {
  green:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  gray: "bg-muted text-muted-foreground",
}

// Maps every CRM enum value (statuses, stages, roles, types) to a colour tone.
const statusTones: Record<string, Tone> = {
  // activity-log actions
  CREATED: "green",
  UPDATED: "amber",
  DELETED: "red",
  // success / positive
  ACTIVE: "green",
  WON: "green",
  ACCEPTED: "green",
  PAID: "green",
  DONE: "green",
  COMPLETED: "green",
  // in-progress / warning
  PROSPECT: "amber",
  PROPOSAL: "amber",
  NEGOTIATION: "amber",
  PARTIAL: "amber",
  ON_HOLD: "amber",
  IN_PROGRESS: "amber",
  // negative
  LOST: "red",
  REJECTED: "red",
  OVERDUE: "red",
  VOID: "red",
  INACTIVE: "red",
  // new / informational
  LEAD: "blue",
  QUALIFICATION: "blue",
  SENT: "blue",
  MANAGER: "blue",
  PRODUCT: "blue",
  // roles / types
  ADMIN: "purple",
  SERVICE: "purple",
  // neutral
  DRAFT: "gray",
  ARCHIVED: "gray",
  EXPIRED: "gray",
  TODO: "gray",
  MEMBER: "gray",
  // workflow run / step statuses (lowercase, from the Workflow SDK)
  running: "amber",
  pending: "gray",
  completed: "green",
  failed: "red",
  cancelled: "gray",
}

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function StatusBadge({ status }: { status: string }) {
  const tone = statusTones[status] ?? "gray"
  return (
    <Badge variant="secondary" className={cn("border-transparent", toneClasses[tone])}>
      {humanize(status)}
    </Badge>
  )
}
