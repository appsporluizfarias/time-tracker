import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TeamClient } from "@/components/admin/team-client";

export default async function AdminTeamPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      approved: true,
      createdAt: true,
      _count: { select: { timeEntries: true } },
    },
    orderBy: [{ approved: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Equipe
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Gerencie os membros da equipe, aprovações e permissões.
      </p>
      <TeamClient initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
