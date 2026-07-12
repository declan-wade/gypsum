import { sleep } from "workflow";
import { prisma } from "@/lib/prisma";
import { notifyProjectDeadline } from "@/lib/email";
import { getWorkflowConfig } from "@/lib/workflow-config";

const DAY_MS = 86_400_000;

// One instance runs per project each time its end date is set or changed. It
// sleeps until `leadDays` before the end date it was started for, then emails
// the team if the project is still active and still due on that date. An end
// date change starts a fresh run; this one notices the date no longer matches
// at wake time and exits quietly.
export async function trackProjectDeadline(projectId: string) {
  "use workflow";

  const initial = await getProjectState(projectId);
  if (!initial.config.enabled) {
    return { projectId, outcome: "disabled" as const };
  }
  if (!initial.project || initial.project.status !== "ACTIVE" || !initial.project.endDate) {
    return { projectId, outcome: "skipped" as const };
  }

  const watchedEndDate = initial.project.endDate;
  const wait =
    new Date(watchedEndDate).getTime() -
    initial.config.leadDays * DAY_MS -
    Date.now();
  if (wait > 0) {
    await sleep(wait);
  }

  const state = await getProjectState(projectId);
  if (!state.config.enabled) {
    return { projectId, outcome: "disabled" as const };
  }
  if (
    !state.project ||
    state.project.status !== "ACTIVE" ||
    !state.project.endDate ||
    new Date(state.project.endDate).getTime() !== new Date(watchedEndDate).getTime()
  ) {
    return { projectId, outcome: "rescheduled-or-inactive" as const };
  }

  await sendDeadlineReminder(projectId, state.config.leadDays);
  return { projectId, outcome: "reminded" as const };
}

async function getProjectState(projectId: string) {
  "use step";
  const [project, config] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true, endDate: true },
    }),
    getWorkflowConfig("project-deadline"),
  ]);
  return {
    project,
    config: {
      enabled: config.enabled,
      leadDays: Number(config.settings.leadDays ?? 7),
    },
  };
}

async function sendDeadlineReminder(projectId: string, leadDays: number) {
  "use step";
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      name: true,
      endDate: true,
      company: { select: { name: true } },
    },
  });
  if (!project?.endDate) return;

  await notifyProjectDeadline({
    name: project.name,
    companyName: project.company.name,
    endDate: project.endDate,
    leadDays,
  });
}
