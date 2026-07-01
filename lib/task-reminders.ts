import { prisma } from "@/lib/prisma";
import { notifyTaskDueSoon } from "@/lib/email";

// Emails assignees about their tasks due within the next `withinHours`, then
// stamps each task's `dueSoonNotifiedAt` so it is reminded at most once.
// Idempotent: tasks already stamped are skipped.
export async function sendDueSoonTaskReminders(withinHours = 24): Promise<number> {
  const now = new Date();
  const horizon = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      status: { not: "DONE" },
      assigneeId: { not: null },
      dueSoonNotifiedAt: null,
      dueDate: { gte: now, lte: horizon },
    },
    select: { id: true, title: true, dueDate: true, assigneeId: true },
  });

  if (tasks.length === 0) return 0;

  // Group by assignee so each person gets a single digest.
  const byAssignee = new Map<string, { title: string; dueDate: Date | null }[]>();
  for (const t of tasks) {
    const list = byAssignee.get(t.assigneeId!) ?? [];
    list.push({ title: t.title, dueDate: t.dueDate });
    byAssignee.set(t.assigneeId!, list);
  }

  await Promise.all(
    [...byAssignee.entries()].map(([assigneeId, taskList]) =>
      notifyTaskDueSoon({ assigneeId, tasks: taskList })
    )
  );

  // Stamp every considered task so it isn't reminded again next run.
  await prisma.task.updateMany({
    where: { id: { in: tasks.map((t) => t.id) } },
    data: { dueSoonNotifiedAt: now },
  });

  return tasks.length;
}
