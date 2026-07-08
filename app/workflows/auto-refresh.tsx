"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

// Periodically re-renders the server component (router.refresh) so in-flight
// workflow runs and steps update without a manual reload. Toggleable so it can
// be paused while inspecting a detail panel.
export function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [on, intervalMs, router]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
    >
      <RefreshCwIcon className={on ? "animate-spin [animation-duration:3s]" : undefined} />
      {on ? "Live" : "Paused"}
    </Button>
  );
}
