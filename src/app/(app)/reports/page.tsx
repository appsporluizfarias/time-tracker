import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReportsClient } from "@/components/reports/reports-client";

export default async function ReportsPage() {
  const session = await auth();
  if (!session) return null;

  const [projects, clients, users] = await Promise.all([
    db.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    session.user.role === "ADMIN"
      ? db.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } })
      : [],
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Reports
      </h1>
      <ReportsClient
        projects={projects}
        clients={clients}
        users={users}
        isAdmin={session.user.role === "ADMIN"}
        currentUserId={session.user.id}
      />
    </div>
  );
}
