import "server-only";

import { prisma } from "@/lib/prisma";
import {
  WORKFLOW_REGISTRY,
  defaultSettings,
  getWorkflowDef,
  type WorkflowDef,
  type WorkflowSettingValue,
} from "@/lib/workflow-registry";

export interface ResolvedWorkflowConfig {
  key: string;
  enabled: boolean;
  settings: Record<string, WorkflowSettingValue>;
}

// Clamp/coerce a stored value to its field definition; fall back to the
// default when the stored value is missing or the wrong shape.
function sanitize(
  def: WorkflowDef,
  stored: Record<string, unknown>
): Record<string, WorkflowSettingValue> {
  const out = defaultSettings(def);
  for (const field of def.fields) {
    const value = stored[field.key];
    if (field.type === "number") {
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isFinite(n)) {
        out[field.key] = Math.min(field.max, Math.max(field.min, Math.round(n)));
      }
    } else if (typeof value === "boolean") {
      out[field.key] = value;
    }
  }
  return out;
}

/**
 * The effective config for one automation: stored row merged over registry
 * defaults. Missing row (or an unreachable table) resolves to enabled +
 * defaults, so automations fail open to their shipped behaviour.
 */
export async function getWorkflowConfig(
  key: string
): Promise<ResolvedWorkflowConfig> {
  const def = getWorkflowDef(key);
  if (!def) return { key, enabled: true, settings: {} };

  try {
    const row = await prisma.workflowConfig.findUnique({
      where: { workflowKey: key },
    });
    return {
      key,
      enabled: row?.enabled ?? true,
      settings: sanitize(def, (row?.settings as Record<string, unknown>) ?? {}),
    };
  } catch {
    return { key, enabled: true, settings: defaultSettings(def) };
  }
}

export async function isWorkflowEnabled(key: string): Promise<boolean> {
  return (await getWorkflowConfig(key)).enabled;
}

/** Effective config for every registered automation, for the Workflows page. */
export async function getAllWorkflowConfigs(): Promise<
  ResolvedWorkflowConfig[]
> {
  let rows: { workflowKey: string; enabled: boolean; settings: unknown }[] = [];
  try {
    rows = await prisma.workflowConfig.findMany();
  } catch {
    rows = [];
  }
  const byKey = new Map(rows.map((r) => [r.workflowKey, r]));
  return WORKFLOW_REGISTRY.map((def) => {
    const row = byKey.get(def.key);
    return {
      key: def.key,
      enabled: row?.enabled ?? true,
      settings: sanitize(def, (row?.settings as Record<string, unknown>) ?? {}),
    };
  });
}

/** Upsert one automation's config (values are sanitized against the registry). */
export async function saveWorkflowConfig(
  key: string,
  enabled: boolean,
  settings: Record<string, unknown>
): Promise<ResolvedWorkflowConfig> {
  const def = getWorkflowDef(key);
  if (!def) throw new Error(`Unknown workflow: ${key}`);

  const clean = sanitize(def, settings);
  await prisma.workflowConfig.upsert({
    where: { workflowKey: key },
    create: { workflowKey: key, enabled, settings: clean },
    update: { enabled, settings: clean },
  });
  return { key, enabled, settings: clean };
}
