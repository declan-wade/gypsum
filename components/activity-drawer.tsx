"use client"

import { HistoryIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/status-badge"
import { formatDateTime } from "@/lib/format"

export interface ActivityItem {
  id: string
  action: string
  summary: string | null
  userName: string | null
  createdAt: Date
}

export function ActivityDrawer({ activities }: { activities: ActivityItem[] }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        <HistoryIcon />
        Activity
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Activity</SheetTitle>
          <SheetDescription>
            {activities.length} {activities.length === 1 ? "event" : "events"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="flex flex-col">
              {activities.map((activity, index) => (
                <li key={activity.id} className="flex gap-3">
                  {/* timeline rail */}
                  <div className="flex flex-col items-center">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                    {index < activities.length - 1 && (
                      <span className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 pb-6">
                    <StatusBadge status={activity.action} />
                    {activity.summary && (
                      <p className="text-sm text-foreground">{activity.summary}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {activity.userName ?? "System"} · {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
