import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiToken } from "@/lib/api-auth";

/**
 * @openapi
 * /api/v1/tasks:
 *   get:
 *     summary: List tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: sprintId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of tasks
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

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
