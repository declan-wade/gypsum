import { PageLayout } from "@/components/page-layout";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { getWorkflowsOverview } from "@/lib/workflow-observability";
import { columns } from "./columns";
import { AutoRefresh } from "./auto-refresh";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { runs, counts, available } = await getWorkflowsOverview();

  const active = counts.running + counts.pending;
  const stats = [
    { label: "Active", value: active, hint: `${counts.running} running · ${counts.pending} pending` },
    { label: "Completed", value: counts.completed },
    { label: "Failed", value: counts.failed },
    { label: "Cancelled", value: counts.cancelled },
  ];

  return (
    <PageLayout title="Workflows" actions={<AutoRefresh />}>
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
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                  {stat.hint ? (
                    <span className="text-xs text-muted-foreground">{stat.hint}</span>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Runs ({runs.length})</h2>
            <DataTable columns={columns} data={runs} searchPlaceholder="Search runs..." />
          </div>
        </>
      )}
    </PageLayout>
  );
}
