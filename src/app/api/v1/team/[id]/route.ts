import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

function getUserStatus(user: { approved: boolean; active: boolean }) {
  if (!user.approved) return "pending";
  if (!user.active) return "blocked";
  return "active";
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "DEV", "VIEWER"]).optional(),
  status: z.enum(["active", "pending", "blocked"]).optional(),
});

/**
 * @openapi
 * /team/{id}:
 *   get:
 *     summary: Get team member profile
 *     description: "**Admin only.** Returns full profile including total hours and entry count."
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
 *         description: User profile with stats
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update team member
 *     description: "**Admin only.** Updates name, role, or status. Setting status to 'blocked' invalidates active sessions."
 *     tags: [Team Management]
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
 *               name: { type: string }
 *               role: { type: string, enum: [ADMIN, DEV, VIEWER] }
 *               status: { type: string, enum: [active, pending, blocked] }
 *     responses:
 *       200:
 *         description: Updated user profile
 *       400:
 *         description: Validation error or self-block attempt
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
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
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const stats = await db.timeEntry.aggregate({
    where: { userId: params.id },
    _sum: { hours: true },
    _count: { id: true },
  });

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: getUserStatus(user),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    totalHours: Number(stats._sum.hours ?? 0),
    entriesCount: stats._count.id,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, role, status } = parsed.data;

  if (status === "blocked" && params.id === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot block your own account." },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (role !== undefined) updateData.role = role;
  if (status === "active") {
    updateData.approved = true;
    updateData.active = true;
  } else if (status === "pending") {
    updateData.approved = false;
    updateData.active = false;
  } else if (status === "blocked") {
    updateData.approved = true;
    updateData.active = false;
  }

  const [updated] = await Promise.all([
    db.user.update({
      where: { id: params.id },
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
      data: updateData,
    }),
    status === "blocked"
      ? db.session.deleteMany({ where: { userId: params.id } })
      : Promise.resolve(),
  ]);

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    status: getUserStatus(updated),
    createdAt: updated.createdAt,
    lastLoginAt: updated.lastLoginAt,
  });
}
