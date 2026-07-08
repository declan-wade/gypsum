import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatDuration } from "@/lib/format";
import { getWorkflowRun, type StepSummary } from "@/lib/workflow-observability";
import { AutoRefresh } from "../auto-refresh";

export const dynamic = "force-dynamic";

function JsonBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
        {value}
      </pre>
    </div>
  );
}

function StepRow({ step, isLast }: { step: StepSummary; isLast: boolean }) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span
          className="mt-1.5 size-2 shrink-0 rounded-full"
          data-status={step.status}
          style={{
            backgroundColor:
              step.status === "failed"
                ? "var(--color-red-500)"
                : step.status === "completed"
                  ? "var(--color-green-500)"
                  : step.status === "running"
                    ? "var(--color-amber-500)"
                    : "var(--color-muted-foreground)",
          }}
        />
        {!isLast && <span className="w-px flex-1 bg-border" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{step.stepName}</span>
          <StatusBadge status={step.status} />
          {step.attempt > 1 && (
            <span className="text-xs text-muted-foreground">attempt {step.attempt}</span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            {formatDuration(step.durationMs)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {step.startedAt ? `Started ${formatDateTime(step.startedAt)}` : "Not started"}
          {step.retryAfter ? ` · retry after ${formatDateTime(step.retryAfter)}` : ""}
        </div>
        {step.errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {step.errorMessage}
          </div>
        )}
        {(step.input || step.output) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <JsonBlock label="Input" value={step.input} />
            <JsonBlock label="Output" value={step.output} />
          </div>
        )}
      </div>
    </li>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ run: string }>;
}) {
  const { run: runId } = await params;
  const run = await getWorkflowRun(runId);

  if (!run) {
    notFound();
  }

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Status", value: <StatusBadge status={run.status} /> },
    { label: "Workflow", value: run.workflowName },
    { label: "Started", value: formatDateTime(run.startedAt ?? run.createdAt) },
    { label: "Finished", value: formatDateTime(run.completedAt) },
    { label: "Duration", value: formatDuration(run.durationMs) },
    { label: "Run ID", value: <span className="font-mono text-xs">{run.runId}</span> },
  ];

  return (
    <PageLayout
      title={run.workflowName}
      actions={
        <>
          <Button variant="outline" nativeButton={false} render={<Link href="/workflows" />}>
            <ArrowLeftIcon />
            Back
          </Button>
          <AutoRefresh />
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((detail) => (
            <div key={detail.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">{detail.label}</span>
              <span className="text-sm">{detail.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {run.errorMessage && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400">Error</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <span className="text-sm">{run.errorMessage}</span>
            {run.errorStack && (
              <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                {run.errorStack}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {(run.input || run.output) && (
        <Card>
          <CardHeader>
            <CardTitle>Input / Output</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <JsonBlock label="Input" value={run.input} />
            <JsonBlock label="Output" value={run.output} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">Steps ({run.steps.length})</h2>
        {run.steps.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No steps recorded yet.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <ol className="flex flex-col">
                {run.steps.map((step, i) => (
                  <StepRow key={step.stepId} step={step} isLast={i === run.steps.length - 1} />
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
