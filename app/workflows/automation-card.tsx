"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { successToast, errorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type {
  WorkflowDef,
  WorkflowSettingValue,
} from "@/lib/workflow-registry";
import { updateAutomation } from "./actions";

const ENGINE_LABELS: Record<WorkflowDef["engine"], string> = {
  workflow: "Durable workflow",
  cron: "Daily cron",
  inline: "Instant",
};

export function AutomationCard({
  def,
  enabled: initialEnabled,
  settings: initialSettings,
}: {
  def: WorkflowDef;
  enabled: boolean;
  settings: Record<string, WorkflowSettingValue>;
}) {
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [settings, setSettings] = React.useState(initialSettings);
  const [saved, setSaved] = React.useState(initialSettings);
  const [pending, startTransition] = React.useTransition();

  const dirty = def.fields.some((f) => settings[f.key] !== saved[f.key]);

  function persist(nextEnabled: boolean, nextSettings: typeof settings) {
    const prevEnabled = enabled;
    startTransition(async () => {
      try {
        const result = await updateAutomation(def.key, nextEnabled, nextSettings);
        setEnabled(result.enabled);
        setSettings(result.settings);
        setSaved(result.settings);
        successToast(`Saved "${def.name}"`);
      } catch (error) {
        setEnabled(prevEnabled);
        errorToast(
          error instanceof Error ? error.message : "Failed to save automation"
        );
      }
    });
  }

  function toggle(next: boolean) {
    setEnabled(next);
    persist(next, settings);
  }

  return (
    <Card className={cn("gap-3", !enabled && "opacity-75")}>
      <div className="flex items-start gap-3 px-(--card-spacing)">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{def.name}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
              {ENGINE_LABELS[def.engine]}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {def.description}
          </p>
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
            Trigger: <span className="text-foreground/80">{def.trigger}</span>
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={toggle}
          disabled={pending}
          aria-label={`Enable ${def.name}`}
        />
      </div>

      {def.fields.length > 0 && (
        <div className="flex flex-col gap-3 border-t px-(--card-spacing) pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {def.fields.map((field) =>
              field.type === "number" ? (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <Label
                    htmlFor={`${def.key}-${field.key}`}
                    className="text-xs"
                  >
                    {field.label}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`${def.key}-${field.key}`}
                      type="number"
                      min={field.min}
                      max={field.max}
                      className="h-8 w-24 tabular-nums"
                      value={String(settings[field.key] ?? field.default)}
                      disabled={!enabled || pending}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          [field.key]: Number(e.target.value),
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {field.unit}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {field.description}
                  </span>
                </div>
              ) : (
                <div key={field.key} className="flex items-start gap-2.5">
                  <Switch
                    id={`${def.key}-${field.key}`}
                    checked={Boolean(settings[field.key] ?? field.default)}
                    disabled={!enabled || pending}
                    onCheckedChange={(checked) =>
                      setSettings((s) => ({ ...s, [field.key]: checked }))
                    }
                  />
                  <div className="flex flex-col gap-0.5">
                    <Label
                      htmlFor={`${def.key}-${field.key}`}
                      className="text-xs"
                    >
                      {field.label}
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {field.description}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
          {dirty && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() => persist(enabled, settings)}
              >
                {pending ? "Saving…" : "Save changes"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => setSettings(saved)}
              >
                Discard
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
