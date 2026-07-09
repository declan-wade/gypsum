import "server-only";

import { getWorld } from "workflow/runtime";
import { WorkflowRunNotFoundError } from "workflow/internal/errors";
import {
  hydrateResourceIO,
  observabilityRevivers,
  parseWorkflowName,
  parseStepName,
} from "workflow/observability";

// Reads the Workflow SDK's "world" — the same store the workflow engine reads
// and writes at runtime (local filesystem in dev, Vercel in production). We map
// its records into plain, client-serializable objects so pages and client
// components can consume them directly.

export type WorkflowStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface RunSummary {
  runId: string;
  workflowName: string;
  status: WorkflowStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface StepSummary {
  stepId: string;
  stepName: string;
  status: WorkflowStatus;
  attempt: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  retryAfter: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  input: string | null;
  output: string | null;
}

export interface RunDetail extends RunSummary {
  input: string | null;
  output: string | null;
  errorStack: string | null;
  steps: StepSummary[];
}

export interface WorkflowsOverview {
  runs: RunSummary[];
  counts: Record<WorkflowStatus, number>;
  // False when the world can't be reached / isn't configured — lets the UI show
  // a helpful empty state instead of crashing.
  available: boolean;
}

const ACTIVE_LIMIT = 100;
const RECENT_LIMIT = 50;

function iso(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function durationMs(
  status: WorkflowStatus,
  startedAt: string | null,
  completedAt: string | null
): number | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const ms = end - start;
  return ms >= 0 ? ms : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRun(run: any): RunSummary {
  const status = run.status as WorkflowStatus;
  const startedAt = iso(run.startedAt);
  const completedAt = iso(run.completedAt);
  return {
    runId: run.runId,
    workflowName: safeParse(parseWorkflowName, run.workflowName),
    status,
    createdAt: iso(run.createdAt) ?? new Date(0).toISOString(),
    startedAt,
    completedAt,
    updatedAt: iso(run.updatedAt) ?? new Date(0).toISOString(),
    durationMs: durationMs(status, startedAt, completedAt),
    errorMessage: run.error?.message ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStep(step: any): StepSummary {
  const status = step.status as WorkflowStatus;
  const startedAt = iso(step.startedAt);
  const completedAt = iso(step.completedAt);
  const { input, output } = hydrateIO(step);
  return {
    stepId: step.stepId,
    stepName: safeParse(parseStepName, step.stepName),
    status,
    attempt: typeof step.attempt === "number" ? step.attempt : 0,
    createdAt: iso(step.createdAt) ?? new Date(0).toISOString(),
    startedAt,
    completedAt,
    retryAfter: iso(step.retryAfter),
    durationMs: durationMs(status, startedAt, completedAt),
    errorMessage: step.error?.message ?? null,
    input,
    output,
  };
}

// parseWorkflowName / parseStepName return { shortName, moduleSpecifier,
// functionName }. We want the human-readable function name (e.g.
// "trackInvoiceOverdue"), falling back to the raw stored name.
function safeParse(
  fn: (v: string) => { functionName?: string; shortName?: string } | null,
  value: string
): string {
  try {
    const parsed = fn(value);
    return parsed?.functionName || parsed?.shortName || value;
  } catch {
    return value;
  }
}

// Serialized step/run I/O is a binary devalue blob; hydrate it back to plain
// values via the SDK's revivers, then pretty-print for display. Best-effort —
// any failure just yields null so the panel shows "—".
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hydrateIO(resource: any): { input: string | null; output: string | null } {
  try {
    const hydrated = hydrateResourceIO(resource, observabilityRevivers);
    return {
      input: stringify(hydrated?.input),
      output: stringify(hydrated?.output),
    };
  } catch {
    return { input: null, output: null };
  }
}

function stringify(value: unknown): string | null {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const EMPTY_COUNTS: Record<WorkflowStatus, number> = {
  pending: 0,
  running: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
};

export async function getWorkflowsOverview(): Promise<WorkflowsOverview> {
  try {
    const world = getWorld();
    // Fetch active runs explicitly (they can be long-lived — an invoice
    // reminder workflow sleeps for weeks — so they might otherwise fall outside
    // the most-recent window), then a recent slice for history.
    const [running, pending, recent] = await Promise.all([
      world.runs.list({
        status: "running",
        resolveData: "none",
        pagination: { limit: ACTIVE_LIMIT, sortOrder: "desc" },
      }),
      world.runs.list({
        status: "pending",
        resolveData: "none",
        pagination: { limit: ACTIVE_LIMIT, sortOrder: "desc" },
      }),
      world.runs.list({
        resolveData: "none",
        pagination: { limit: RECENT_LIMIT, sortOrder: "desc" },
      }),
    ]);

    const byId = new Map<string, RunSummary>();
    for (const run of [...running.data, ...pending.data, ...recent.data]) {
      const mapped = mapRun(run);
      byId.set(mapped.runId, mapped);
    }

    const runs = [...byId.values()].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const counts = { ...EMPTY_COUNTS };
    for (const run of runs) counts[run.status] += 1;

    return { runs, counts, available: true };
  } catch {
    return { runs: [], counts: { ...EMPTY_COUNTS }, available: false };
  }
}

// Returns null ONLY when the run genuinely doesn't exist (so the page can 404).
// Any other failure — most commonly the backend failing to resolve a run's I/O
// blobs when resolveData: "all" is requested — is NOT treated as "not found":
// we degrade to an unresolved fetch so the run still renders, and rethrow if
// even that fails so the real error surfaces in logs instead of a silent 404.
export async function getWorkflowRun(runId: string): Promise<RunDetail | null> {
  const world = getWorld();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let run: any;
  try {
    run = await world.runs.get(runId, { resolveData: "all" });
  } catch (error) {
    if (WorkflowRunNotFoundError.is(error)) return null;
    // The run exists but its data couldn't be resolved — retry without
    // resolving I/O so the page still renders (input/output show as "—").
    console.error(`[workflows] failed to resolve run ${runId}, retrying without data:`, error);
    run = await world.runs.get(runId, { resolveData: "none" }).catch((retryError) => {
      if (WorkflowRunNotFoundError.is(retryError)) return null;
      throw retryError;
    });
  }

  if (!run) return null;

  // Steps are best-effort: a failure listing/resolving them shouldn't 404 the
  // whole run. Fall back to an unresolved list, then to no steps.
  let steps: StepSummary[] = [];
  try {
    const result = await world.steps.list({
      runId,
      resolveData: "all",
      pagination: { limit: 500, sortOrder: "asc" },
    });
    steps = result.data.map(mapStep);
  } catch (error) {
    console.error(`[workflows] failed to resolve steps for run ${runId}:`, error);
    try {
      const result = await world.steps.list({
        runId,
        resolveData: "none",
        pagination: { limit: 500, sortOrder: "asc" },
      });
      steps = result.data.map(mapStep);
    } catch {
      steps = [];
    }
  }

  const summary = mapRun(run);
  const { input, output } = hydrateIO(run);

  return {
    ...summary,
    input,
    output,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errorStack: (run as any).error?.stack ?? null,
    steps,
  };
}
