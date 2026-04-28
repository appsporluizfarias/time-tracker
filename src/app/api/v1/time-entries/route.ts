import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiToken } from "@/lib/api-auth";
import { fireWebhooks } from "@/lib/webhooks";
import { z } from "zod";

const createSchema = z.object({
  date: z.string().datetime(),
  hours: z.number().positive().max(24).optional(),
  description: z.string().optional().default(""),
  billable: z.boolean().optional().default(false),
  osNumber: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  projectId: z.string().optional(),
  clientId: z.string().optional(),
  sprintId: z.string().optional(),
  taskId: z.string().optional(),
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
 * /time-entries:
 *   get:
 *     summary: List time entries
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *         description: Admin/Viewer only
 *       - in: query
 *         name: osNumber
 *         schema: { type: string }
 *         description: Partial (case-insensitive) match on OS number
 *     responses:
 *       200:
 *         description: List of time entries
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const projectId = searchParams.get("projectId");
  const userId = searchParams.get("userId");
  const osNumber = searchParams.get("osNumber");

  const where: Record<string, unknown> = {};

  if (auth.user.role === "DEV") {
    where.userId = auth.user.id;
  } else if (userId) {
    where.userId = userId;
  }

  if (projectId) where.projectId = projectId;
  if (osNumber) where.osNumber = { contains: osNumber, mode: "insensitive" };
  if (startDate || endDate) {
    where.date = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };
  }

  const entries = await db.timeEntry.findMany({
    where,
    include: entryInclude,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

/**
 * @openapi
 * /time-entries:
 *   post:
 *     summary: Create a time entry
 *     tags: [Time Entries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date: { type: string, format: date-time }
 *               hours: { type: number }
 *               description: { type: string }
 *               billable: { type: boolean, default: false }
 *               osNumber: { type: string, nullable: true, example: "OS-1234" }
 *               startAt: { type: string, format: date-time }
 *               endAt: { type: string, format: date-time }
 *               projectId: { type: string }
 *               clientId: { type: string }
 *               sprintId: { type: string }
 *               taskId: { type: string }
 *     responses:
 *       201:
 *         description: Created time entry
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { osNumber, startAt, endAt, hours, ...rest } = parsed.data;

  const entry = await db.timeEntry.create({
    data: {
      ...rest,
      date: new Date(parsed.data.date),
      userId: auth.user.id,
      ...(hours !== undefined && { hours }),
      ...(osNumber && { osNumber }),
      ...(startAt && { startAt: new Date(startAt) }),
      ...(endAt && { endAt: new Date(endAt) }),
    },
    include: entryInclude,
  });

  await fireWebhooks("time_entry.created", entry);

  return NextResponse.json(entry, { status: 201 });
}
