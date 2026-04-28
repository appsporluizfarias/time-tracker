import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");

  const where: Record<string, unknown> = {};
  if (session.user.role === "DEV") where.userId = session.user.id;
  else if (userId) where.userId = userId;
  if (projectId) where.projectId = projectId;
  if (startDate || endDate) {
    where.date = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const entries = await db.timeEntry.findMany({
    where: where as any,
    include: {
      user: { select: { name: true, email: true } },
      project: { select: { name: true } },
      client: { select: { name: true } },
      sprint: { select: { name: true } },
      task: { select: { title: true } },
    },
    orderBy: { date: "asc" },
  });

  const header = "Date,Hours,Billable,User,Project,Client,Sprint,Task,Description\n";
  const rows = entries.map((e) =>
    [
      new Date(e.date).toISOString().split("T")[0],
      e.hours,
      e.billable ? "Yes" : "No",
      e.user.name ?? e.user.email,
      e.project?.name ?? "",
      e.client?.name ?? "",
      e.sprint?.name ?? "",
      e.task?.title ?? "",
      `"${(e.description ?? "").replace(/"/g, '""')}"`,
    ].join(",")
  );

  const csv = header + rows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="time-entries-${Date.now()}.csv"`,
    },
  });
}
