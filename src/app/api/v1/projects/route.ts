import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiToken } from "@/lib/api-auth";

/**
 * @openapi
 * /api/v1/projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const projects = await db.project.findMany({
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { timeEntries: true, tasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(projects);
}
