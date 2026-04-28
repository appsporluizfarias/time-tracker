import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LogTimeForm } from "@/components/time-entries/log-form";
import { redirect } from "next/navigation";

export default async function LogTimePage() {
  const session = await auth();
  if (!session || session.user.role === "VIEWER") redirect("/dashboard");

  const [projects, clients, sprints, tasks] = await Promise.all([
    db.project.findMany({ orderBy: { name: "asc" } }),
    db.client.findMany({ orderBy: { name: "asc" } }),
    db.sprint.findMany({
      orderBy: { startDate: "desc" },
      include: { project: { select: { id: true, name: true } } },
    }),
    db.task.findMany({
      orderBy: { title: "asc" },
      include: { project: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Log Time
      </h1>
      <div className="max-w-2xl">
        <LogTimeForm
          projects={projects}
          clients={clients}
          sprints={sprints}
          tasks={tasks}
        />
      </div>
    </div>
  );
}
