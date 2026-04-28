import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

function getUserStatus(user: { approved: boolean; active: boolean }) {
  if (!user.approved) return "pending";
  if (!user.active) return "blocked";
  return "active";
}

/**
 * @openapi
 * /team:
 *   get:
 *     summary: List team members
 *     description: "**Admin only.** Returns a paginated list of all users."
 *     tags: [Team Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, DEV, VIEWER] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, pending, blocked] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Paginated team member list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const roleFilter = searchParams.get("role");
  const statusFilter = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (roleFilter && ["ADMIN", "DEV", "VIEWER"].includes(roleFilter)) {
    where.role = roleFilter;
  }
  if (statusFilter === "active") {
    where.approved = true;
    where.active = true;
  } else if (statusFilter === "pending") {
    where.approved = false;
  } else if (statusFilter === "blocked") {
    where.approved = true;
    where.active = false;
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        approved: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: getUserStatus(u),
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
    })),
    meta: { total, page, limit },
  });
}
