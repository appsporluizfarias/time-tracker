import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClientsClient } from "@/components/clients/clients-client";
import { redirect } from "next/navigation";

export default async function ClientsPage() {
  const session = await auth();
  if (!session || session.user.role === "VIEWER") redirect("/dashboard");

  const clients = await db.client.findMany({
    include: { _count: { select: { projects: true, timeEntries: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Clients
      </h1>
      <ClientsClient initialClients={clients} isAdmin={session.user.role === "ADMIN"} />
    </div>
  );
}
