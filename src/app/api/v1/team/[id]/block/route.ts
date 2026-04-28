import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

/**
 * @openapi
 * /team/{id}/block:
 *   post:
 *     summary: Block a user
 *     description: "**Admin only.** Sets user status to blocked and deletes active sessions. Returns 400 if attempting to block own account."
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
 *         description: User blocked
 *       400:
 *         description: Cannot block own account
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

  if (params.id === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot block your own account." },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [updated] = await Promise.all([
    db.user.update({
      where: { id: params.id },
      data: { active: false },
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
    }),
    db.session.deleteMany({ where: { userId: params.id } }),
  ]);

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    status: "blocked",
    createdAt: updated.createdAt,
    lastLoginAt: updated.lastLoginAt,
  });
}
