import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { WebhooksClient } from "@/components/webhooks/webhooks-client";
import { redirect } from "next/navigation";

export default async function WebhooksPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const webhooks = await db.webhook.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Webhooks
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Notify external tools (Jira, Trello, Linear, Slack) when time entries are created.
      </p>
      <WebhooksClient initialWebhooks={webhooks} />
    </div>
  );
}
