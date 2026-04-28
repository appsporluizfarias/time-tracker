import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional().default("#6366f1"),
  clientId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await db.project.findMany({
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { timeEntries: true, tasks: true, sprints: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(projects);
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

  const { clientId, ...rest } = parsed.data;
  const project = await db.project.create({
    data: { ...rest, ...(clientId && { clientId }) },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
