import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatHours } from "@/lib/utils";
import {
  Clock,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { RecentEntries } from "@/components/dashboard/recent-entries";

async function getDashboardData(userId: string, role: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const userFilter = role === "DEV" ? { userId } : {};

  const [weekEntries, monthEntries, recentEntries] = await Promise.all([
    db.timeEntry.aggregate({
      where: { ...userFilter, date: { gte: weekStart, lte: weekEnd } },
      _sum: { hours: true },
      _count: true,
    }),
    db.timeEntry.aggregate({
      where: { ...userFilter, date: { gte: monthStart, lte: monthEnd } },
      _sum: { hours: true },
      _count: true,
    }),
    db.timeEntry.findMany({
      where: userFilter,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, color: true } },
        client: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ]);

  return { weekEntries, monthEntries, recentEntries };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const { weekEntries, monthEntries, recentEntries } = await getDashboardData(
    session.user.id,
    session.user.role
  );

  const weekHours = Number(weekEntries._sum.hours ?? 0);
  const monthHours = Number(monthEntries._sum.hours ?? 0);

  const stats = [
    {
      label: "This Week",
      value: formatHours(weekHours),
      sub: `${weekEntries._count} entries`,
      icon: Clock,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      label: "This Month",
      value: formatHours(monthHours),
      sub: `${monthEntries._count} entries`,
      icon: Calendar,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      label: "Daily Average",
      value: formatHours(monthHours / (new Date().getDate())),
      sub: "this month",
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Billable Rate",
      value:
        monthEntries._count > 0
          ? `${Math.round((monthEntries._count / monthEntries._count) * 100)}%`
          : "—",
      sub: "of hours logged",
      icon: DollarSign,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6 sm:mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </span>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stat.sub}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Recent Time Entries
          </h2>
        </div>
        <RecentEntries entries={recentEntries} currentUserId={session.user.id} userRole={session.user.role} />
      </div>
    </div>
  );
}
