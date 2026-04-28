import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiToken } from "@/lib/api-auth";

/**
 * @openapi
 * /api/v1/clients:
 *   get:
 *     summary: List all clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of clients
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateApiToken(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const clients = await db.client.findMany({
    include: { _count: { select: { projects: true, timeEntries: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(clients);
}
