import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiToken } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const patchSchema = z.object({
  date: z.string().datetime().optional(),
  hours: z.number().positive().max(24).optional(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
  osNumber: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  taskId: z.string().nullable().optional(),
});

const entryInclude = {
  user: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true, color: true } },
  client: { select: { id: true, name: true } },
  sprint: { select: { id: true, name: true } },
  task: { select: { id: true, title: true } },
} as const;

/**
 * @openapi
 * /time-entries/{id}:
 *   get:
 *     summary: Get a time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Time entry
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *   patch:
 *     summary: Update a time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string, format: date-time }
 *               hours: { type: number }
 *               description: { type: string }
 *               billable: { type: boolean }
 *               osNumber: { type: string, nullable: true }
 *               projectId: { type: string, nullable: true }
 *               clientId: { type: string, nullable: true }
 *               sprintId: { type: string, nullable: true }
 *               taskId: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated time entry
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const entry = await db.timeEntry.findUnique({
    where: { id: params.id },
    include: entryInclude,
  });

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (auth.user.role === "DEV" && entry.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(entry);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const entry = await db.timeEntry.findUnique({ where: { id: params.id } });
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (auth.user.role === "DEV" && entry.userId !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
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
    include: entryInclude,
  });

  return NextResponse.json(updated);
}
