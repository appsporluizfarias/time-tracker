import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { serializeEntry } from "@/lib/tz";

const updateSchema = z.object({
  date: z.string().optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  hours: z.number().positive().max(24).optional(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
  osNumber: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  integratedAt: z.string().datetime().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await db.timeEntry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "DEV" && entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, startAt, endAt, hours, description, billable, osNumber, projectId, clientId, sprintId, taskId, integratedAt } = parsed.data;

  const updateData: Prisma.TimeEntryUpdateInput = {};
  if (date !== undefined) updateData.date = new Date(date);
  if (startAt !== undefined) updateData.startAt = startAt ? new Date(startAt) : null;
  if (endAt !== undefined) updateData.endAt = endAt ? new Date(endAt) : null;
  if (hours !== undefined) updateData.hours = hours;
  if (description !== undefined) updateData.description = description;
  if (billable !== undefined) updateData.billable = billable;
  if (osNumber !== undefined) updateData.osNumber = osNumber;
  if (projectId !== undefined) updateData.project = projectId ? { connect: { id: projectId } } : { disconnect: true };
  if (clientId !== undefined) updateData.client = clientId ? { connect: { id: clientId } } : { disconnect: true };
  if (sprintId !== undefined) updateData.sprint = sprintId ? { connect: { id: sprintId } } : { disconnect: true };
  if (taskId !== undefined) updateData.task = taskId ? { connect: { id: taskId } } : { disconnect: true };
  if (integratedAt !== undefined) updateData.integratedAt = integratedAt ? new Date(integratedAt) : null;

  const updated = await db.timeEntry.update({
    where: { id: params.id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, color: true } },
      client: { select: { id: true, name: true } },
      sprint: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(serializeEntry(updated));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entry = await db.timeEntry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "DEV" && entry.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.timeEntry.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
