import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersClient } from "@/components/users/users-client";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { timeEntries: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Users
      </h1>
      <UsersClient initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
