"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { TimeEntryEditDialog } from "@/components/time-entries/edit-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Entry {
  id: string;
  date: string;
  hours: unknown;
  description: string;
  billable: boolean;
  osNumber: string | null;
  startAt: string | null;
  endAt: string | null;
  userId: string;
  user: { id: string; name: string | null };
  project: { id: string; name: string; color: string } | null;
  client: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
}

interface Project { id: string; name: string; color: string }
interface Client { id: string; name: string }
interface Sprint { id: string; name: string; projectId: string }
interface User { id: string; name: string | null; email: string }

interface Filters {
  startDate: string;
  endDate: string;
  projectId: string;
  clientId: string;
  sprintId: string;
  osNumber: string;
  billable: string;
  userId: string;
}

interface EntriesClientProps {
  projects: Project[];
  clients: Client[];
  sprints: Sprint[];
  users: User[];
  currentUserId: string;
  userRole: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL = "all";
const DEFAULT_FILTERS: Filters = {
  startDate: "",
  endDate: "",
  projectId: ALL,
  clientId: ALL,
  sprintId: ALL,
  osNumber: "",
  billable: ALL,
  userId: ALL,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(hours: unknown): string {
  const h = Number(hours);
  if (!h || isNaN(h)) return "—";
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  if (whole === 0) return `${mins}min`;
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}min`;
}

function formatTotalHours(hours: number): string {
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (whole === 0) return `${mins}min`;
  if (mins === 0) return `${whole}h`;
  return `${whole}h ${mins}min`;
}

function getDayLabel(dateKey: string): string {
  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterdayKey = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  const date = new Date(dateKey + "T12:00:00Z");
  const weekday = format(date, "EEE", { locale: ptBR });
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const full = format(date, "dd MMM yyyy", { locale: ptBR });
  const base = `${cap}, ${full}`;

  if (dateKey === todayKey) return `Hoje — ${base}`;
  if (dateKey === yesterdayKey) return `Ontem — ${base}`;
  return base;
}

function hasActive(f: Filters): boolean {
  return (
    !!f.startDate ||
    !!f.endDate ||
    f.projectId !== ALL ||
    f.clientId !== ALL ||
    f.sprintId !== ALL ||
    !!f.osNumber ||
    f.billable !== ALL ||
    f.userId !== ALL
  );
}

// ─── Replay button ────────────────────────────────────────────────────────────

function ReplayButton({ entry }: { entry: Entry }) {
  function handleReplay(e: React.MouseEvent) {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("apexio:replay", {
        detail: {
          description: entry.description || "",
          osNumber: entry.osNumber || "",
          projectId: entry.project?.id || "none",
          billable: entry.billable,
        },
      })
    );
  }
  return (
    <button
      onClick={handleReplay}
      className="flex-shrink-0 rounded p-1.5 text-[#00C9E0] hover:bg-[#00C9E0]/10 transition-colors"
      title="Repetir esta atividade"
    >
      <Play className="h-3.5 w-3.5" />
    </button>
  );
}

// ─── Mobile entry row ─────────────────────────────────────────────────────────

function MobileRow({
  entry,
  canEdit,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  canEdit: boolean;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <ReplayButton entry={entry} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {entry.description || (
                <span className="text-gray-400 italic">Sem descrição</span>
              )}
            </p>
            {entry.project && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: entry.project.color }}
                />
                {entry.project.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatDuration(entry.hours)}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 bg-gray-50/50 dark:bg-gray-800/30 space-y-2">
          {entry.startAt && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Início:</span> {format(new Date(entry.startAt), "dd/MM/yyyy HH:mm")}
            </p>
          )}
          {entry.osNumber && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">OS:</span> {entry.osNumber}
            </p>
          )}
          {entry.client && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Cliente:</span> {entry.client.name}
            </p>
          )}
          {entry.task && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Tarefa:</span> {entry.task.title}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <Badge variant={entry.billable ? "success" : "outline"} className="text-xs">
              {entry.billable ? "Faturável" : "Não faturável"}
            </Badge>
            {canEdit && (
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                  className="rounded p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                  className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Desktop entry row ────────────────────────────────────────────────────────

function DesktopRow({
  entry,
  canEdit,
  onEdit,
  onDelete,
}: {
  entry: Entry;
  canEdit: boolean;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors group">
      <td className="px-4 py-3 w-8">
        <ReplayButton entry={entry} />
      </td>
      <td className="px-4 py-3 max-w-xs">
        <p className="text-sm text-gray-900 dark:text-white truncate">
          {entry.description || (
            <span className="text-gray-400 italic text-sm">Sem descrição</span>
          )}
        </p>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {entry.startAt ? format(new Date(entry.startAt), "dd/MM HH:mm") : "—"}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {entry.osNumber || "—"}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
        {formatDuration(entry.hours)}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {entry.project ? (
          <span className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.project.color }}
            />
            {entry.project.name}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {entry.billable ? (
          <span className="text-[#14B8A6] text-xs font-medium">💰 Faturável</span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        {canEdit && (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(entry)}
              className="rounded p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Day group ────────────────────────────────────────────────────────────────

function DayGroup({
  dateKey,
  dayEntries,
  totalHours,
  canEdit,
  onEdit,
  onDelete,
}: {
  dateKey: string;
  dayEntries: Entry[];
  totalHours: number;
  canEdit: (e: Entry) => boolean;
  onEdit: (e: Entry) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      {/* Day header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {getDayLabel(dateKey)}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {formatTotalHours(totalHours)}
        </span>
      </div>

      {/* Mobile rows */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {dayEntries.map((entry) => (
          <MobileRow
            key={entry.id}
            entry={entry}
            canEdit={canEdit(entry)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Desktop rows */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {dayEntries.map((entry) => (
              <DesktopRow
                key={entry.id}
                entry={entry}
                canEdit={canEdit(entry)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  setFilters,
  projects,
  clients,
  sprints,
  users,
  userRole,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  projects: Project[];
  clients: Client[];
  sprints: Sprint[];
  users: User[];
  userRole: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = hasActive(filters);

  function setQuick(period: "today" | "week" | "month") {
    const now = new Date();
    if (period === "today") {
      const d = now.toISOString().slice(0, 10);
      setFilters((f) => ({ ...f, startDate: d, endDate: d }));
    } else if (period === "week") {
      setFilters((f) => ({
        ...f,
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      }));
    } else {
      setFilters((f) => ({
        ...f,
        startDate: format(startOfMonth(now), "yyyy-MM-dd"),
        endDate: format(endOfMonth(now), "yyyy-MM-dd"),
      }));
    }
  }

  const filterContent = (
    <div className="space-y-4">
      {/* Date range + quick buttons */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            className="h-9 text-sm w-36"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            className="h-9 text-sm w-36"
          />
        </div>
        <div className="flex gap-1">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setQuick(p)}
              className="h-9 px-3 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {p === "today" ? "Hoje" : p === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* Other filters */}
      <div className="flex flex-wrap gap-2">
        {/* Project */}
        <Select
          value={filters.projectId}
          onValueChange={(v) => setFilters((f) => ({ ...f, projectId: v, sprintId: ALL }))}
        >
          <SelectTrigger className="h-9 text-sm w-40">
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os projetos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Client */}
        <Select
          value={filters.clientId}
          onValueChange={(v) => setFilters((f) => ({ ...f, clientId: v }))}
        >
          <SelectTrigger className="h-9 text-sm w-36">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sprint */}
        <Select
          value={filters.sprintId}
          onValueChange={(v) => setFilters((f) => ({ ...f, sprintId: v }))}
        >
          <SelectTrigger className="h-9 text-sm w-36">
            <SelectValue placeholder="Sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {sprints
              .filter((s) => filters.projectId === ALL || s.projectId === filters.projectId)
              .map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* OS Number */}
        <Input
          value={filters.osNumber}
          onChange={(e) => setFilters((f) => ({ ...f, osNumber: e.target.value }))}
          placeholder="Nº OS…"
          className="h-9 text-sm w-28"
        />

        {/* Billable */}
        <Select
          value={filters.billable}
          onValueChange={(v) => setFilters((f) => ({ ...f, billable: v }))}
        >
          <SelectTrigger className="h-9 text-sm w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            <SelectItem value="true">Faturável</SelectItem>
            <SelectItem value="false">Não faturável</SelectItem>
          </SelectContent>
        </Select>

        {/* User (admin only) */}
        {userRole === "ADMIN" && (
          <Select
            value={filters.userId}
            onValueChange={(v) => setFilters((f) => ({ ...f, userId: v }))}
          >
            <SelectTrigger className="h-9 text-sm w-40">
              <SelectValue placeholder="Membro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os membros</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear filters */}
        {active && (
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="h-9 px-3 rounded-md text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 flex items-center gap-1.5 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 mb-4">
      {/* Mobile toggle */}
      <button
        className="sm:hidden w-full flex items-center justify-between px-4 py-3"
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {active && (
            <span className="h-2 w-2 rounded-full bg-[#F97316]" />
          )}
        </span>
        {mobileOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {/* Desktop: always visible */}
      <div className="hidden sm:block p-4">{filterContent}</div>

      {/* Mobile: collapsible */}
      {mobileOpen && <div className="sm:hidden px-4 pb-4">{filterContent}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function EntriesClient({
  projects,
  clients,
  sprints,
  users,
  currentUserId,
  userRole,
}: EntriesClientProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.projectId !== ALL) params.set("projectId", filters.projectId);
    if (filters.clientId !== ALL) params.set("clientId", filters.clientId);
    if (filters.sprintId !== ALL) params.set("sprintId", filters.sprintId);
    if (filters.osNumber) params.set("osNumber", filters.osNumber);
    if (filters.billable !== ALL) params.set("billable", filters.billable);
    if (filters.userId !== ALL) params.set("userId", filters.userId);

    const res = await fetch(`/api/time-entries?${params}`);
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchEntries, filters.osNumber ? 400 : 0); // debounce text input
    return () => clearTimeout(t);
  }, [fetchEntries, filters.osNumber]);

  // Group by UTC date key
  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const key = String(entry.date).slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return Array.from(map.keys())
      .sort()
      .reverse()
      .map((dateKey) => {
        const dayEntries = map.get(dateKey)!;
        const totalHours = dayEntries.reduce(
          (sum, e) => sum + Number(e.hours ?? 0),
          0
        );
        return { dateKey, dayEntries, totalHours };
      });
  }, [entries]);

  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours ?? 0), 0);

  const canEdit = (entry: Entry) =>
    userRole === "ADMIN" || entry.userId === currentUserId;

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  return (
    <>
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        projects={projects}
        clients={clients}
        sprints={sprints}
        users={users}
        userRole={userRole}
      />

      {/* Entry groups */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-gray-500 dark:text-gray-400">
          Carregando…
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 px-6 py-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum lançamento encontrado.
          </p>
          {hasActive(filters) && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-2 text-sm text-[#00C9E0] hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ dateKey, dayEntries, totalHours: dayTotal }) => (
            <DayGroup
              key={dateKey}
              dateKey={dateKey}
              dayEntries={dayEntries}
              totalHours={dayTotal}
              canEdit={canEdit}
              onEdit={setEditEntry}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Footer totals */}
      {!loading && entries.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
          Total filtrado:{" "}
          <strong className="text-gray-900 dark:text-white">
            {formatTotalHours(totalHours)}
          </strong>{" "}
          · {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
        </div>
      )}

      {/* Edit dialog */}
      {editEntry && (
        <TimeEntryEditDialog
          entry={editEntry}
          onClose={() => setEditEntry(null)}
          onSaved={() => {
            setEditEntry(null);
            fetchEntries();
          }}
        />
      )}
    </>
  );
}
