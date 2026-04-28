import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/**
 * @openapi
 * /team/{id}/approve:
 *   post:
 *     summary: Approve a pending user
 *     description: "**Admin only.** Sets user status to active (approved=true, active=true)."
 *     tags: [Team Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User approved
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await db.user.update({
    where: { id: params.id },
    data: { approved: true, active: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      approved: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    status: "active",
    createdAt: updated.createdAt,
    lastLoginAt: updated.lastLoginAt,
  });
}
