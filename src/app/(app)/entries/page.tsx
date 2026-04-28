import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EntriesClient } from "@/components/entries/entries-client";

export const dynamic = "force-dynamic";

export default async function EntriesPage() {
  const session = await auth();
  if (!session) return null;

  const [projects, clients, sprints] = await Promise.all([
    db.project.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
    db.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.sprint.findMany({
      select: { id: true, name: true, projectId: true },
      orderBy: { startDate: "desc" },
    }),
  ]);

  const users =
    session.user.role === "ADMIN"
      ? await db.user.findMany({
          where: { approved: true, active: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Time Entries
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Histórico completo de lançamentos de horas
        </p>
      </div>
      <EntriesClient
        projects={projects}
        clients={clients}
        sprints={sprints}
        users={users}
        currentUserId={session.user.id}
        userRole={session.user.role}
      />
    </div>
  );
}
