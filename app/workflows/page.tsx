import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { RecordSection } from "@/components/record-section";
import { StatStrip, type StatStripItem } from "@/components/stat-strip";
import { getWorkflowsOverview } from "@/lib/workflow-observability";
import { getAllWorkflowConfigs } from "@/lib/workflow-config";
import { WORKFLOW_REGISTRY } from "@/lib/workflow-registry";
import { columns } from "./columns";
import { AutoRefresh } from "./auto-refresh";
import { AutomationCard } from "./automation-card";

export const dynamic = "force-dynamic";

const CATEGORIES = ["Finance", "Sales", "Delivery"] as const;

export default async function Page() {
  const [{ runs, counts, available }, configs] = await Promise.all([
    getWorkflowsOverview(),
    getAllWorkflowConfigs(),
  ]);

  const configByKey = new Map(configs.map((c) => [c.key, c]));
  const enabledCount = configs.filter((c) => c.enabled).length;

  const stats: StatStripItem[] = [
    {
      label: "Automations enabled",
      value: `${enabledCount} / ${WORKFLOW_REGISTRY.length}`,
    },
    {
      label: "Active runs",
      value: counts.running + counts.pending,
    },
    { label: "Completed", value: counts.completed },
    {
      label: "Failed",
      value: counts.failed,
      className:
        counts.failed > 0 ? "text-red-600 dark:text-red-400" : undefined,
    },
  ];

  return (
    <PageLayout title="Workflows" actions={<AutoRefresh />}>
      <StatStrip stats={stats} />

      {/* automation settings, grouped by category */}
      {CATEGORIES.map((category) => {
        const defs = WORKFLOW_REGISTRY.filter((d) => d.category === category);
        if (defs.length === 0) return null;
        return (
          <div key={category} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {category}
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {defs.map((def) => {
                const config = configByKey.get(def.key);
                return (
                  <AutomationCard
                    key={def.key}
                    def={def}
                    enabled={config?.enabled ?? true}
                    settings={config?.settings ?? {}}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* run history */}
      {!available ? (
        <Card>
          <CardContent className="flex flex-col gap-1 py-8 text-center">
            <span className="text-sm font-medium">Workflow data unavailable</span>
            <span className="text-sm text-muted-foreground">
              The workflow engine store couldn&apos;t be reached. In local dev this populates once a
              workflow has run; in production it reads from the Vercel workflow backend.
            </span>
          </CardContent>
        </Card>
      ) : (
        <RecordSection title="Runs" count={runs.length}>
          <DataTable columns={columns} data={runs} searchPlaceholder="Search runs..." />
        </RecordSection>
      )}
    </PageLayout>
  );
}
