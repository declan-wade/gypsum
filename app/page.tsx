import Link from "next/link";
import {
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { formatDate, formatMoney, formatRelativeTime } from "@/lib/format";
import { getArAging } from "@/lib/invoice-ar";
import { getRecentActivities } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

const AGING_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

const PIPELINE_STAGES = [
  { stage: "QUALIFICATION", label: "Qualification" },
  { stage: "PROPOSAL", label: "Proposal" },
  { stage: "NEGOTIATION", label: "Negotiation" },
] as const;

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Resolves the signed-in Neon Auth user's display name (login users live in
// the neon_auth schema, so this is a raw lookup — same convention as lib/activity).
async function currentUserName(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const rows = await prisma.$queryRaw<{ name: string | null }[]>(
    Prisma.sql`SELECT name FROM neon_auth."user" WHERE id = ${userId} LIMIT 1`
  );
  return rows[0]?.name ?? null;
}

function KpiCard({
  label,
  value,
  sub,
  badge,
  badgeClassName,
}: {
  label: string;
  value: string | number;
  sub: string;
  badge?: string;
  badgeClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          {badge ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                badgeClassName ??
                  "bg-muted text-muted-foreground"
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <span className="mt-2 text-[27px] font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        <span className="mt-0.5 text-xs text-muted-foreground">{sub}</span>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel,
  meta,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold">{title}</span>
      {meta}
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-xs font-medium text-primary hover:underline"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

const activityIconStyles: Record<
  string,
  { className: string; Icon: typeof PlusIcon }
> = {
  CREATED: {
    className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Icon: PlusIcon,
  },
  UPDATED: {
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    Icon: PencilIcon,
  },
  DELETED: {
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    Icon: Trash2Icon,
  },
};

function dueBadge(dueDate: Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfToday);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 2);

  if (dueDate < startOfToday)
    return {
      label: "Overdue",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };
  if (dueDate < startOfTomorrow)
    return {
      label: "Today",
      className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };
  if (dueDate < startOfDayAfter)
    return {
      label: "Tomorrow",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    };
  return {
    label: new Intl.DateTimeFormat("en-AU", { weekday: "short" }).format(
      dueDate
    ),
    className: "bg-muted text-muted-foreground",
  };
}

export default async function Page() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const dueSoonCutoff = new Date(now);
  dueSoonCutoff.setDate(dueSoonCutoff.getDate() + 14);

  const user = await getCurrentUser();

  const [
    userName,
    companies,
    contacts,
    pipelineByStage,
    invoiceTotals,
    unpaidCount,
    overdueCount,
    revenueThisMonth,
    revenueLastMonth,
    activeProjectCount,
    projectsDueSoon,
    activeProjects,
    activities,
    myTasks,
    aging,
  ] = await Promise.all([
    currentUserName(user?.id ?? null),
    prisma.company.count(),
    prisma.contact.count(),
    prisma.deal.groupBy({
      by: ["stage"],
      where: { stage: { notIn: ["WON", "LOST"] } },
      _count: true,
      _sum: { value: true },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true, amountPaid: true },
      where: { status: { notIn: ["PAID", "VOID"] } },
    }),
    prisma.invoice.count({ where: { status: { notIn: ["PAID", "VOID"] } } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: monthStart } },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: lastMonthStart, lt: monthStart } },
    }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.project.count({
      where: { status: "ACTIVE", endDate: { lte: dueSoonCutoff } },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      include: {
        company: { select: { name: true } },
        tasks: { select: { status: true } },
      },
      orderBy: [{ endDate: "asc" }],
      take: 4,
    }),
    getRecentActivities(5),
    user
      ? prisma.task.findMany({
          where: {
            assigneeId: user.id,
            status: { not: "DONE" },
            dueDate: { not: null, lte: weekAhead },
          },
          orderBy: { dueDate: "asc" },
          take: 5,
        })
      : Promise.resolve([]),
    getArAging(),
  ]);

  const openDeals = pipelineByStage.reduce((sum, s) => sum + s._count, 0);
  const pipelineValue = pipelineByStage.reduce(
    (sum, s) => sum + Number(s._sum.value ?? 0),
    0
  );
  const outstanding =
    Number(invoiceTotals._sum.total ?? 0) -
    Number(invoiceTotals._sum.amountPaid ?? 0);
  const revenue = Number(revenueThisMonth._sum.amount ?? 0);
  const lastRevenue = Number(revenueLastMonth._sum.amount ?? 0);
  const revenueDelta =
    lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : null;

  const totalOutstanding = aging.reduce((sum, b) => sum + b.amount, 0);
  const visibleBuckets = aging
    .map((bucket, i) => ({ ...bucket, color: AGING_COLORS[i] }))
    .filter((b) => b.amount > 0);

  const stageRows = PIPELINE_STAGES.map(({ stage, label }) => {
    const row = pipelineByStage.find((s) => s.stage === stage);
    return {
      label,
      count: row?._count ?? 0,
      value: Number(row?._sum.value ?? 0),
    };
  });
  const maxStageValue = Math.max(...stageRows.map((s) => s.value), 1);

  const projectRows = activeProjects.map((project) => {
    const total = project.tasks.length;
    const done = project.tasks.filter((t) => t.status === "DONE").length;
    return {
      id: project.id,
      name: project.name,
      companyName: project.company.name,
      endDate: project.endDate,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  return (
    <PageLayout title="Dashboard">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          {greetingForHour(now.getHours())}
          {userName ? `, ${userName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Intl.DateTimeFormat("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(now)}
          {overdueCount > 0
            ? ` · ${overdueCount} invoice${overdueCount === 1 ? "" : "s"} need${
                overdueCount === 1 ? "s" : ""
              } attention`
            : ""}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Pipeline value"
          value={formatMoney(pipelineValue)}
          sub={
            openDeals > 0
              ? `${openDeals} open deal${openDeals === 1 ? "" : "s"} · avg ${formatMoney(pipelineValue / openDeals)}`
              : "No open deals"
          }
        />
        <KpiCard
          label="Outstanding invoices"
          value={formatMoney(outstanding)}
          sub={`across ${unpaidCount} invoice${unpaidCount === 1 ? "" : "s"}`}
          badge={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
          badgeClassName="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
        />
        <KpiCard
          label="Revenue this month"
          value={formatMoney(revenue)}
          sub={`vs ${formatMoney(lastRevenue)} last month`}
          badge={
            revenueDelta === null
              ? undefined
              : `${revenueDelta >= 0 ? "▲" : "▼"} ${Math.abs(revenueDelta).toFixed(1)}%`
          }
          badgeClassName={
            revenueDelta !== null && revenueDelta < 0
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
              : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
          }
        />
        <KpiCard
          label="Active projects"
          value={activeProjectCount}
          sub={`${companies} companies · ${contacts} contacts`}
          badge={
            projectsDueSoon > 0 ? `${projectsDueSoon} due soon` : undefined
          }
        />
      </div>

      {/* AR aging + pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardContent className="flex flex-col">
            <SectionHeader
              title="Accounts receivable — aging"
              meta={
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatMoney(totalOutstanding)}
                  </span>{" "}
                  outstanding
                </span>
              }
            />
            {totalOutstanding > 0 ? (
              <div className="mt-4 flex h-3.5 gap-0.5 overflow-hidden rounded-full">
                {visibleBuckets.map((bucket) => (
                  <div
                    key={bucket.label}
                    className={bucket.color}
                    style={{
                      width: `${(bucket.amount / totalOutstanding) * 100}%`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 h-3.5 rounded-full bg-muted" />
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {aging.map((bucket, i) => (
                <div key={bucket.label}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className={cn("size-2 rounded-[3px]", AGING_COLORS[i])}
                    />
                    {bucket.label}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-[15px] font-semibold tabular-nums",
                      i === aging.length - 1 && bucket.amount > 0
                        ? "text-red-600 dark:text-red-400"
                        : undefined
                    )}
                  >
                    {formatMoney(bucket.amount)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {bucket.count} invoice{bucket.count === 1 ? "" : "s"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col">
            <SectionHeader
              title="Pipeline by stage"
              href="/deals"
              linkLabel="View deals"
            />
            <div className="mt-4 flex flex-col gap-3">
              {stageRows.map((stage) => (
                <div key={stage.label}>
                  <div className="mb-1.5 flex items-baseline justify-between text-xs">
                    <span>
                      {stage.label}{" "}
                      <span className="text-muted-foreground">
                        · {stage.count}
                      </span>
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatMoney(stage.value)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(stage.value / maxStageValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* activity + tasks + projects */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-[1.35fr_1fr_1fr]">
        <Card>
          <CardContent className="flex flex-col">
            <SectionHeader
              title="Recent activity"
              href="/activities"
              linkLabel="View all"
            />
            <div className="mt-2 flex flex-col divide-y">
              {activities.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  No recent activity.
                </p>
              ) : (
                activities.map((activity) => {
                  const { className, Icon } =
                    activityIconStyles[activity.action] ??
                    activityIconStyles.UPDATED;
                  return (
                    <div key={activity.id} className="flex gap-3 py-2.5">
                      <div
                        className={cn(
                          "grid size-6.5 shrink-0 place-items-center rounded-full",
                          className
                        )}
                      >
                        <Icon className="size-3" />
                      </div>
                      <p className="min-w-0 flex-1 text-[13px] leading-snug">
                        {activity.summary ??
                          `${activity.entityType} ${activity.action.toLowerCase()}`}
                        {activity.userName ? (
                          <span className="text-muted-foreground">
                            {" "}
                            — {activity.userName}
                          </span>
                        ) : null}
                      </p>
                      <span className="text-[11px] whitespace-nowrap text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col">
            <SectionHeader
              title="Due this week"
              href="/my-tasks"
              linkLabel="My tasks"
            />
            <div className="mt-2 flex flex-col divide-y">
              {myTasks.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Nothing due this week. Nice work!
                </p>
              ) : (
                myTasks.map((task) => {
                  const badge = dueBadge(task.dueDate!);
                  return (
                    <div key={task.id} className="flex items-center gap-2.5 py-2.5">
                      <span className="size-3.5 shrink-0 rounded-[5px] border-[1.5px] border-muted-foreground/40" />
                      <span className="min-w-0 flex-1 truncate text-[13px]">
                        {task.title}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col">
            <SectionHeader
              title="Active projects"
              href="/projects"
              linkLabel="All projects"
            />
            <div className="mt-3 flex flex-col gap-3.5">
              {projectRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active projects.
                </p>
              ) : (
                projectRows.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group"
                  >
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                      <span className="font-medium group-hover:underline">
                        {project.name}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          project.progress >= 80 ? "bg-green-500" : "bg-primary"
                        )}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {project.companyName}
                      {project.endDate
                        ? ` · due ${formatDate(project.endDate)}`
                        : ""}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
