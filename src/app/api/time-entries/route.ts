import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { fireWebhooks } from "@/lib/webhooks";

const createSchema = z.object({
  date: z.string(),
  hours: z.number().positive().max(24).optional(),
  description: z.string().optional().default(""),
  billable: z.boolean().optional().default(false),
  osNumber: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");
  const clientId = searchParams.get("clientId");
  const sprintId = searchParams.get("sprintId");
  const osNumber = searchParams.get("osNumber");
  const billable = searchParams.get("billable");

  const where: Record<string, unknown> = {};

  if (session.user.role === "DEV") {
    where.userId = session.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (projectId) where.projectId = projectId;
  if (clientId) where.clientId = clientId;
  if (sprintId) where.sprintId = sprintId;
  if (osNumber) where.osNumber = { contains: osNumber, mode: "insensitive" };
  if (billable === "true") where.billable = true;
  else if (billable === "false") where.billable = false;
  if (startDate || endDate) {
    where.date = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const entries = await db.timeEntry.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, color: true } },
      client: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { clientId, sprintId, taskId, projectId, osNumber, startAt, endAt, hours, ...rest } = parsed.data;

  const entry = await db.timeEntry.create({
    data: {
      ...rest,
      date: new Date(parsed.data.date),
      userId: session.user.id,
      ...(hours !== undefined && { hours }),
      ...(osNumber && { osNumber }),
      ...(startAt && { startAt: new Date(startAt) }),
      ...(endAt && { endAt: new Date(endAt) }),
      ...(projectId && { projectId }),
      ...(clientId && { clientId }),
      ...(sprintId && { sprintId }),
      ...(taskId && { taskId }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, color: true } },
      client: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  await fireWebhooks("time_entry.created", entry);

  return NextResponse.json(entry, { status: 201 });
}
