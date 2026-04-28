import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { TimerBar } from "@/components/timer/timer-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const showTimer = session.user.role !== "VIEWER";

  const projects = showTimer
    ? await db.project.findMany({ select: { id: true, name: true, color: true }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile: fixed header is h-14, TimerBar sits below it */}
        {/* Desktop: TimerBar is the top of the content column */}
        <div className="pt-14 lg:pt-0 flex-shrink-0">
          {showTimer && <TimerBar projects={projects} />}
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
