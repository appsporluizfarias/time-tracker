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
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  _count: { projects: number; timeEntries: number };
}

interface ClientsClientProps {
  initialClients: Client[];
  isAdmin: boolean;
}

export function ClientsClient({ initialClients, isAdmin }: ClientsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState({ name: "", email: "", company: "" });

  function openCreate() {
    setEditClient(null);
    setForm({ name: "", email: "", company: "" });
    setOpen(true);
  }

  function openEdit(client: Client) {
    setEditClient(client);
    setForm({
      name: client.name,
      email: client.email ?? "",
      company: client.company ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    const url = editClient ? `/api/clients/${editClient.id}` : "/api/clients";
    const method = editClient ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        email: form.email || null,
        company: form.company || null,
      }),
    });
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editClient ? "Edit Client" : "New Client"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Client name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!form.name}>
                  {editClient ? "Save" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {initialClients.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No clients yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Company</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Projects</th>
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Entries</th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {initialClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{client.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{client.company ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{client.email ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{client._count.projects}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{client._count.timeEntries}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(client)}
                        className="rounded p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
