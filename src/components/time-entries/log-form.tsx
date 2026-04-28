"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
import { CheckCircle } from "lucide-react";

interface Project { id: string; name: string }
interface Client { id: string; name: string }
interface Sprint { id: string; name: string; projectId: string; project: { id: string; name: string } }
interface Task { id: string; title: string; projectId: string; project: { id: string; name: string } }

interface LogTimeFormProps {
  projects: Project[];
  clients: Client[];
  sprints: Sprint[];
  tasks: Task[];
}

const NONE = "none";
const MODE_MANUAL = "manual";
const MODE_RANGE = "range";

type Mode = typeof MODE_MANUAL | typeof MODE_RANGE;

function calcHoursFromRange(startAt: string, endAt: string): number | null {
  if (!startAt || !endAt) return null;
  const diff = (new Date(endAt).getTime() - new Date(startAt).getTime()) / 1000 / 3600;
  return diff > 0 ? diff : null;
}

function formatHoursDisplay(h: number): string {
  const hrs = Math.floor(h);
  const min = Math.round((h - hrs) * 60);
  if (hrs === 0) return `${min}min`;
  if (min === 0) return `${hrs}h`;
  return `${hrs}h ${min}min`;
}

export function LogTimeForm({ projects, clients, sprints, tasks }: LogTimeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>(MODE_MANUAL);

  const todayDate = format(new Date(), "yyyy-MM-dd");
  const nowTime = format(new Date(), "HH:mm");

  const [form, setForm] = useState({
    date: todayDate,
    hours: "8",
    description: "",
    osNumber: "",
    billable: false,
    projectId: "",
    clientId: NONE,
    sprintId: NONE,
    taskId: NONE,
    startAt: `${todayDate}T${nowTime}`,
    endAt: "",
  });

  const filteredSprints = sprints.filter(
    (s) => !form.projectId || s.projectId === form.projectId
  );
  const filteredTasks = tasks.filter(
    (t) => !form.projectId || t.projectId === form.projectId
  );

  const rangeHours = mode === MODE_RANGE
    ? calcHoursFromRange(form.startAt, form.endAt)
    : null;

  // Auto-fill date from startAt when in range mode
  useEffect(() => {
    if (mode === MODE_RANGE && form.startAt) {
      const d = form.startAt.split("T")[0];
      if (d) setForm((prev) => ({ ...prev, date: d }));
    }
  }, [form.startAt, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const hours = mode === MODE_RANGE ? rangeHours : Number(form.hours);
    if (!hours || hours <= 0) {
      setError("Informe um intervalo de tempo válido.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date(form.date).toISOString(),
        hours,
        description: form.description,
        osNumber: form.osNumber || undefined,
        billable: form.billable,
        projectId: form.projectId || undefined,
        clientId: form.clientId === NONE ? null : form.clientId,
        sprintId: form.sprintId === NONE ? null : form.sprintId,
        taskId: form.taskId === NONE ? null : form.taskId,
        ...(mode === MODE_RANGE && form.startAt && { startAt: new Date(form.startAt).toISOString() }),
        ...(mode === MODE_RANGE && form.endAt && { endAt: new Date(form.endAt).toISOString() }),
      }),
    });

    setLoading(false);

    if (res.ok) {
      setSuccess(true);
      setForm({
        date: todayDate,
        hours: "8",
        description: "",
        osNumber: "",
        billable: false,
        projectId: "",
        clientId: NONE,
        sprintId: NONE,
        taskId: NONE,
        startAt: `${todayDate}T${nowTime}`,
        endAt: "",
      });
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Falha ao salvar lançamento");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Horas lançadas com sucesso!
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm font-medium w-fit">
          <button
            type="button"
            onClick={() => setMode(MODE_MANUAL)}
            className={`px-4 py-2 transition-colors ${mode === MODE_MANUAL ? "bg-[#0F1C2E] text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"}`}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => setMode(MODE_RANGE)}
            className={`px-4 py-2 transition-colors ${mode === MODE_RANGE ? "bg-[#0F1C2E] text-white" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"}`}
          >
            Início / Fim
          </button>
        </div>

        {/* Time inputs */}
        {mode === MODE_MANUAL ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="text-base"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Horas</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                className="text-base"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startAt">Início</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  className="text-base"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endAt">Fim</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                  className="text-base"
                  required
                />
              </div>
            </div>
            {rangeHours !== null && (
              <p className="text-sm text-[#00C9E0] font-medium">
                Duração calculada: <strong>{formatHoursDisplay(rangeHours)}</strong>
              </p>
            )}
          </div>
        )}

        {/* Description + OS Number */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="No que você trabalhou?"
              className="text-base"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="osNumber">Nº da OS</Label>
            <Input
              id="osNumber"
              value={form.osNumber}
              onChange={(e) => setForm({ ...form, osNumber: e.target.value })}
              placeholder="OS-1234"
              className="text-base"
            />
          </div>
        </div>

        {/* Project */}
        <div className="space-y-1.5">
          <Label>Projeto</Label>
          <Select
            value={form.projectId || NONE}
            onValueChange={(v) =>
              setForm({ ...form, projectId: v === NONE ? "" : v, sprintId: NONE, taskId: NONE })
            }
          >
            <SelectTrigger className="text-base h-11">
              <SelectValue placeholder="Selecione um projeto" />
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

        {/* Client + Sprint */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select
              value={form.clientId}
              onValueChange={(v) => setForm({ ...form, clientId: v })}
            >
              <SelectTrigger className="text-base h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sprint</Label>
            <Select
              value={form.sprintId}
              onValueChange={(v) => setForm({ ...form, sprintId: v })}
            >
              <SelectTrigger className="text-base h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nenhum</SelectItem>
                {filteredSprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task */}
        <div className="space-y-1.5">
          <Label>Tarefa</Label>
          <Select
            value={form.taskId}
            onValueChange={(v) => setForm({ ...form, taskId: v })}
          >
            <SelectTrigger className="text-base h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhuma</SelectItem>
              {filteredTasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Billable */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="billable"
            checked={form.billable}
            onChange={(e) => setForm({ ...form, billable: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316]"
          />
          <Label htmlFor="billable">Faturável</Label>
        </div>
      </div>

      {/* Submit — sticky on mobile */}
      <div className="px-4 pb-4 sm:px-6 sm:pb-6 sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-4 sm:static sm:border-0 sm:pt-0">
        <Button
          type="submit"
          disabled={loading || (mode === MODE_RANGE && rangeHours === null)}
          className="w-full h-12 text-base font-semibold bg-[#F97316] hover:bg-[#EA580C] text-white"
        >
          {loading ? "Lançando…" : "Lançar Horas"}
        </Button>
      </div>
    </form>
  );
}
