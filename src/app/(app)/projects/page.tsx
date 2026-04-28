import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProjectsClient } from "@/components/projects/projects-client";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) return null;

  const projects = await db.project.findMany({
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { timeEntries: true, tasks: true, sprints: true } },
    },
    orderBy: { name: "asc" },
  });

  const clients = await db.client.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Projects
      </h1>
      <ProjectsClient
        initialProjects={projects}
        clients={clients}
        canEdit={session.user.role !== "VIEWER"}
        isAdmin={session.user.role === "ADMIN"}
      />
    </div>
  );
}
