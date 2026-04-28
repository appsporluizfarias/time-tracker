import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  projectId: z.string(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  const sprints = await db.sprint.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { tasks: true, timeEntries: true } },
    },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(sprints);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role === "VIEWER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const sprint = await db.sprint.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
    include: { project: { select: { id: true, name: true } } },
  });

  return NextResponse.json(sprint, { status: 201 });
}
