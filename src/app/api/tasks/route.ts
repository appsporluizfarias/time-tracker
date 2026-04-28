import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional().default("TODO"),
  projectId: z.string(),
  sprintId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const sprintId = searchParams.get("sprintId");

  const tasks = await db.task.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(sprintId && { sprintId }),
    },
    include: {
      project: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
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

  const { sprintId, ...rest } = parsed.data;
  const task = await db.task.create({
    data: { ...rest, ...(sprintId && { sprintId }) },
    include: {
      project: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
