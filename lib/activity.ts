import { prisma } from "@/lib/prisma";
import type { ActivityAction } from "@prisma/client";

// Records an audit-trail entry. `userId` is accepted now so call sites are ready
// for auth; until then it defaults to null ("System").
// Fetches an entity's audit trail as plain, client-serializable objects.
export async function getActivities(entityType: string, entityId: string) {
  const activities = await prisma.activity.findMany({
    where: { entityType, entityId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return activities.map((a) => ({
    id: a.id,
    action: a.action,
    summary: a.summary,
    userName: a.user?.name ?? null,
    createdAt: a.createdAt,
  }));
}

// The most recent audit-trail entries across all entities, for the Activity page.
export async function getRecentActivities(limit = 100) {
  const activities = await prisma.activity.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return activities.map((a) => ({
    id: a.id,
    entityType: a.entityType,
    entityId: a.entityId,
    action: a.action,
    summary: a.summary,
    userName: a.user?.name ?? null,
    createdAt: a.createdAt,
  }));
}

export async function logActivity(params: {
  entityType: string;
  entityId: string;
  action: ActivityAction;
  summary?: string;
  userId?: string | null;
}) {
  await prisma.activity.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      summary: params.summary ?? null,
      userId: params.userId ?? null,
    },
  });
}
