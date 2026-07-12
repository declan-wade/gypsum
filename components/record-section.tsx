import { Card } from "@/components/ui/card"

// Card-styled section for a record's related tables: header row with title,
// count pill and an optional action, table (children) below.
export function RecordSection({
  id,
  title,
  count,
  action,
  children,
}: {
  id?: string
  title: string
  count: number
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-4 gap-3">
      <div className="flex items-center gap-2.5 border-b px-(--card-spacing) pb-3">
        <span className="text-sm font-semibold">{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {count}
        </span>
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      <div className="px-(--card-spacing)">{children}</div>
    </Card>
  )
}
