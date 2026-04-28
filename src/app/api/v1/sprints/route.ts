import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiToken } from "@/lib/api-auth";

/**
 * @openapi
 * /api/v1/sprints:
 *   get:
 *     summary: List sprints
 *     tags: [Sprints]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of sprints
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
