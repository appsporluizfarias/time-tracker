"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface Entry {
  id: string;
  date: Date | string;
  hours: unknown;
  description: string | null;
  billable: boolean;
  osNumber?: string | null;
  project: { id: string; name: string } | null;
}

interface Project {
  id: string;
  name: string;
}

interface TimeEntryEditDialogProps {
  entry: Entry;
  onClose: () => void;
  onSaved: () => void;
}

const NONE = "none";

export function TimeEntryEditDialog({
  entry,
  onClose,
  onSaved,
}: TimeEntryEditDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(entry.date), "yyyy-MM-dd"),
    hours: String(Number(entry.hours) || ""),
    description: entry.description ?? "",
    osNumber: entry.osNumber ?? "",
    billable: entry.billable,
    projectId: entry.project?.id ?? NONE,
  });

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects);
  }, []);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/time-entries/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(form.date).toISOString(),
        hours: form.hours ? Number(form.hours) : undefined,
        description: form.description,
        osNumber: form.osNumber || null,
        billable: form.billable,
        projectId: form.projectId === NONE ? null : form.projectId,
      }),
    });
    setLoading(false);
    onSaved();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Horas</Label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                className="text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Projeto</Label>
            <Select
              value={form.projectId}
              onValueChange={(v) => setForm({ ...form, projectId: v })}
            >
              <SelectTrigger className="text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem projeto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="No que você trabalhou?"
              className="text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nº da OS</Label>
            <Input
              value={form.osNumber}
              onChange={(e) => setForm({ ...form, osNumber: e.target.value })}
              placeholder="OS-1234"
              className="text-base"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable-edit"
              checked={form.billable}
              onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316]"
            />
            <Label htmlFor="billable-edit">Faturável</Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white"
            >
              {loading ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
