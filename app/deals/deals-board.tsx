"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { DealStage } from "@prisma/client";
import { cn } from "@/lib/utils";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { RowActions } from "@/components/row-actions";
import { errorToast } from "@/lib/toast";
import { updateDealStage } from "./actions";
import { DealForm } from "./forms";
import type { DealRow } from "./columns";

const STAGES: DealStage[] = [
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export function DealsBoard({ data }: { data: DealRow[] }) {
  const router = useRouter();
  // Local copy so a drop updates the board immediately (optimistic); it is
  // re-synced from the server data whenever the page revalidates.
  const [deals, setDeals] = React.useState(data);
  const [dragOver, setDragOver] = React.useState<DealStage | null>(null);
  const dragId = React.useRef<string | null>(null);

  React.useEffect(() => {
    setDeals(data);
  }, [data]);

  const byStage = React.useMemo(() => {
    const map = new Map<DealStage, DealRow[]>();
    for (const stage of STAGES) map.set(stage, []);
    for (const deal of deals) map.get(deal.stage)?.push(deal);
    return map;
  }, [deals]);

  async function moveDeal(id: string, stage: DealStage) {
    const current = deals.find((d) => d.id === id);
    if (!current || current.stage === stage) return;

    const previous = deals;
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage } : d))
    );
    try {
      await updateDealStage(id, stage);
      router.refresh();
    } catch {
      setDeals(previous);
      errorToast("Couldn't move the deal. Please try again.");
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {STAGES.map((stage) => {
        const column = byStage.get(stage) ?? [];
        const total = column.reduce((sum, d) => sum + d.value, 0);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(stage);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDragOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const id = dragId.current;
              dragId.current = null;
              if (id) moveDeal(id, stage);
            }}
            className={cn(
              "flex w-72 shrink-0 flex-col gap-3 rounded-xl border bg-muted/40 p-3 transition-colors",
              dragOver === stage && "border-primary/50 bg-muted"
            )}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={stage} />
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {column.length}
                </span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatMoney(total)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {column.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  No deals
                </p>
              ) : (
                column.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => {
                      dragId.current = deal.id;
                    }}
                    onDragEnd={() => {
                      dragId.current = null;
                      setDragOver(null);
                    }}
                    className="group/card flex cursor-grab flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground shadow-xs transition-shadow hover:shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm leading-snug font-medium">
                        {deal.title}
                      </p>
                      <div className="-mr-1 -mt-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                        <RowActions
                          editTitle="Edit Deal"
                          editForm={
                            <DealForm
                              record={{
                                id: deal.id,
                                title: deal.title,
                                value: deal.value,
                                stage: deal.stage,
                                companyId: deal.companyId,
                                expectedCloseDate: deal.expectedCloseDate,
                              }}
                            />
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {deal.companyName}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {formatMoney(deal.value)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(deal.expectedCloseDate)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
