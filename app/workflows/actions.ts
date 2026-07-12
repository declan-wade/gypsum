"use server";

import { revalidatePath } from "next/cache";
import { hasModuleAccess } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { saveWorkflowConfig } from "@/lib/workflow-config";
import { getWorkflowDef } from "@/lib/workflow-registry";

export async function updateAutomation(
  key: string,
  enabled: boolean,
  settings: Record<string, number | boolean>
) {
  if (!(await hasModuleAccess("workflows"))) {
    throw new Error("You don't have access to manage workflows.");
  }
  const def = getWorkflowDef(key);
  if (!def) {
    throw new Error(`Unknown automation: ${key}`);
  }

  const saved = await saveWorkflowConfig(key, enabled, settings);
  await logActivity({
    entityType: "WorkflowConfig",
    entityId: key,
    action: "UPDATED",
    summary: `${enabled ? "Enabled" : "Disabled"} automation "${def.name}"`,
  });
  revalidatePath("/workflows");
  return saved;
}
