import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const groupBy = searchParams.get("groupBy") ?? "project";

  const where: Record<string, unknown> = {};
  if (session.user.role === "DEV") where.userId = session.user.id;
  if (startDate || endDate) {
    where.date = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const entries = await db.timeEntry.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
    },
  });

  const summary: Record<string, { name: string; hours: number; billableHours: number; count: number }> = {};

  for (const entry of entries) {
    let key: string;
    let name: string;

    switch (groupBy) {
      case "client":
        key = entry.clientId ?? "no-client";
        name = entry.client?.name ?? "No Client";
        break;
      case "sprint":
        key = entry.sprintId ?? "no-sprint";
        name = entry.sprint?.name ?? "No Sprint";
        break;
      case "user":
        key = entry.userId;
        name = entry.user.name ?? "Unknown";
        break;
      default:
        key = entry.projectId ?? "no-project";
        name = entry.project?.name ?? "Sem projeto";
    }

    if (!summary[key]) {
      summary[key] = { name, hours: 0, billableHours: 0, count: 0 };
    }

    const hours = Number(entry.hours);
    summary[key].hours += hours;
    if (entry.billable) summary[key].billableHours += hours;
    summary[key].count += 1;
  }

  return NextResponse.json(
    Object.entries(summary).map(([id, data]) => ({ id, ...data }))
  );
}
