"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Zap } from "lucide-react";
import { format } from "date-fns";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: Date;
}

interface WebhooksClientProps {
  initialWebhooks: Webhook[];
}

const EVENT_OPTIONS = [
  "time_entry.created",
  "time_entry.updated",
  "time_entry.deleted",
];

export function WebhooksClient({ initialWebhooks }: WebhooksClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    url: "",
    secret: "",
    events: ["time_entry.created"],
  });

  function toggleEvent(event: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter((e) => e !== event)
        : [...f.events, event],
    }));
  }

  async function handleCreate() {
    await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, secret: form.secret || undefined }),
    });
    setOpen(false);
    setForm({ name: "", url: "", secret: "", events: ["time_entry.created"] });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook?")) return;
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Webhook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Slack Notification"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://hooks.example.com/..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Secret (optional)</Label>
                <Input
                  value={form.secret}
                  onChange={(e) => setForm({ ...form, secret: e.target.value })}
                  placeholder="Used for HMAC signature verification"
                />
              </div>
              <div className="space-y-2">
                <Label>Events</Label>
                {EVENT_OPTIONS.map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={event}
                      checked={form.events.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600"
                    />
                    <label htmlFor={event} className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {event}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.name || !form.url}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {initialWebhooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <Zap className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No webhooks configured.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {initialWebhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{webhook.name}</h3>
                    <Badge variant={webhook.active ? "success" : "outline"}>
                      {webhook.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate mb-2">
                    {webhook.url}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {webhook.events.map((event) => (
                      <span
                        key={event}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Created {format(new Date(webhook.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(webhook.id, webhook.active)}
                  >
                    {webhook.active ? "Disable" : "Enable"}
                  </Button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
