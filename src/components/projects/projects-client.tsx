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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  client: { id: string; name: string } | null;
  _count: { timeEntries: number; tasks: number; sprints: number };
}

interface Client { id: string; name: string }

interface ProjectsClientProps {
  initialProjects: Project[];
  clients: Client[];
  canEdit: boolean;
  isAdmin: boolean;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#06b6d4", "#84cc16", "#f97316",
];

export function ProjectsClient({
  initialProjects,
  clients,
  canEdit,
  isAdmin,
}: ProjectsClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    clientId: "none",
  });

  function openCreate() {
    setEditProject(null);
    setForm({ name: "", description: "", color: "#6366f1", clientId: "none" });
    setOpen(true);
  }

  function openEdit(project: Project) {
    setEditProject(project);
    setForm({
      name: project.name,
      description: project.description ?? "",
      color: project.color,
      clientId: project.client?.id ?? "none",
    });
    setOpen(true);
  }

  async function handleSave() {
    const url = editProject
      ? `/api/projects/${editProject.id}`
      : "/api/projects";
    const method = editProject ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        clientId: form.clientId === "none" ? null : form.clientId,
      }),
    });
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project? This will also delete all its sprints and tasks.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-6 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editProject ? "Edit Project" : "New Project"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Project name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Client</Label>
                  <Select
                    value={form.clientId}
                    onValueChange={(v) => setForm({ ...form, clientId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm({ ...form, color })}
                        className={`h-8 w-8 rounded-full transition-transform ${
                          form.color === color
                            ? "scale-125 ring-2 ring-offset-2 ring-gray-400"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!form.name}>
                    {editProject ? "Save" : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialProjects.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
            <FolderOpen className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No projects yet.
            </p>
          </div>
        )}
        {initialProjects.map((project) => (
          <div
            key={project.id}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  {project.client && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {project.client.name}
                    </p>
                  )}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(project)}
                    className="rounded p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {project.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {project.description}
              </p>
            )}

            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{project._count.timeEntries} entries</span>
              <span>{project._count.tasks} tasks</span>
              <span>{project._count.sprints} sprints</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
