import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  date: z.string().optional(),
  hours: z.number().positive().max(24).optional(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
  osNumber: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
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

  const { date, hours, description, billable, osNumber, projectId, clientId, sprintId, taskId } = parsed.data;

  const updateData: Prisma.TimeEntryUncheckedUpdateInput = {};
  if (date !== undefined) updateData.date = new Date(date);
  if (hours !== undefined) updateData.hours = hours;
  if (description !== undefined) updateData.description = description;
  if (billable !== undefined) updateData.billable = billable;
  if (osNumber !== undefined) updateData.osNumber = osNumber;
  if (projectId !== undefined) updateData.projectId = projectId;
  if (clientId !== undefined) updateData.clientId = clientId;
  if (sprintId !== undefined) updateData.sprintId = sprintId;
  if (taskId !== undefined) updateData.taskId = taskId;

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

  return NextResponse.json(updated);
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
