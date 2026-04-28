import { db } from "./db";
import crypto from "crypto";

export async function fireWebhooks(
  event: string,
  payload: Record<string, unknown>
) {
  const webhooks = await db.webhook.findMany({
    where: { active: true, events: { has: event } },
  });

  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      const body = JSON.stringify({ event, data: payload });
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-ApexioTimer-Event": event,
      };

      if (webhook.secret) {
        const sig = crypto
          .createHmac("sha256", webhook.secret)
          .update(body)
          .digest("hex");
        headers["X-ApexioTimer-Signature"] = `sha256=${sig}`;
      }

      await fetch(webhook.url, { method: "POST", headers, body });
    })
  );
}
