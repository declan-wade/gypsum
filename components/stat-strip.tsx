import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface StatStripItem {
  label: string
  value: string | number
  /** Extra classes for the value, e.g. a warning colour. */
  className?: string
}

// Horizontal strip of key figures for a record header (design: "stat strip").
export function StatStrip({ stats }: { stats: StatStripItem[] }) {
  return (
    <Card className="py-0">
      <div
        className={cn(
          "grid grid-cols-2 divide-y sm:grid-cols-3 sm:divide-x",
          stats.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
          "lg:divide-y-0"
        )}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="px-5 py-3.5">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div
              className={cn(
                "mt-1 text-lg font-semibold tabular-nums",
                stat.className
              )}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
