"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Square, Timer, ChevronUp, ChevronDown, X } from "lucide-react";
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

const TIMER_KEY = "apexio_timer_state";
const NONE = "none";

interface TimerState {
  status: "stopped" | "running" | "paused";
  originalStartedAt: number | null;
  lastResumedAt: number | null;
  elapsed: number;
  description: string;
  osNumber: string;
  projectId: string;
  billable: boolean;
}

interface ReplayData {
  description: string;
  osNumber: string;
  projectId: string;
  billable: boolean;
}

const DEFAULT_STATE: TimerState = {
  status: "stopped",
  originalStartedAt: null,
  lastResumedAt: null,
  elapsed: 0,
  description: "",
  osNumber: "",
  projectId: NONE,
  billable: false,
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getTotalSeconds(state: TimerState): number {
  if (state.status === "running" && state.lastResumedAt) {
    return state.elapsed + Math.floor((Date.now() - state.lastResumedAt) / 1000);
  }
  return state.elapsed;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

// ─── Stop modal ───────────────────────────────────────────────────────────────

interface StopModalProps {
  timerState: TimerState;
  displaySeconds: number;
  projects: Project[];
  onSave: (data: { description: string; osNumber: string; projectId: string; billable: boolean }) => Promise<void>;
  onDiscard: () => void;
  saving: boolean;
}

function StopModal({ timerState, displaySeconds, projects, onSave, onDiscard, saving }: StopModalProps) {
  const [form, setForm] = useState({
    description: timerState.description,
    osNumber: timerState.osNumber,
    projectId: timerState.projectId,
    billable: timerState.billable,
  });

  const hours = displaySeconds / 3600;
  const hoursDisplay =
    hours >= 1 ? `${hours.toFixed(2)}h` : `${Math.round(hours * 60)}min`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onDiscard} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-[#F97316]" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Salvar lançamento
            </h2>
          </div>
          <button
            onClick={onDiscard}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5 bg-gradient-to-br from-[#0F1C2E] to-[#1A2E48] text-center">
          <p className="text-4xl font-mono font-bold text-white tracking-wider">
            {formatTime(displaySeconds)}
          </p>
          <p className="text-sm text-white/50 mt-1">{hoursDisplay} registrado</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="No que você trabalhou?"
              className="text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nº da OS</Label>
              <Input
                value={form.osNumber}
                onChange={(e) => setForm({ ...form, osNumber: e.target.value })}
                placeholder="OS-1234"
                className="text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Projeto</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v })}
              >
                <SelectTrigger className="text-base">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Nenhum</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="stop-billable"
              checked={form.billable}
              onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316]"
            />
            <Label htmlFor="stop-billable">Faturável</Label>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
            onClick={onDiscard}
            disabled={saving}
          >
            Descartar
          </Button>
          <Button
            className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white"
            onClick={() => onSave(form)}
            disabled={saving || !form.description.trim()}
          >
            {saving ? "Salvando…" : "Salvar entrada"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Replay conflict modal ────────────────────────────────────────────────────

function ReplayConflictModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          Timer em andamento
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Você tem um timer rodando. Deseja parar e iniciar esta atividade?
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white"
            onClick={onConfirm}
          >
            Parar e iniciar este
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── TimerBar ─────────────────────────────────────────────────────────────────

interface TimerBarProps {
  projects: Project[];
}

export function TimerBar({ projects }: TimerBarProps) {
  const router = useRouter();
  const [state, setState] = useState<TimerState>(DEFAULT_STATE);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [showStopModal, setShowStopModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pendingReplay, setPendingReplay] = useState<ReplayData | null>(null);
  const [showReplayConflict, setShowReplayConflict] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<TimerState>(state);

  // Keep stateRef in sync with state to avoid stale closures in event handlers
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TIMER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TimerState;
        setState(parsed);
        setDisplaySeconds(getTotalSeconds(parsed));
      } catch {}
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(TIMER_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  // Live clock interval
  useEffect(() => {
    if (state.status === "running") {
      intervalRef.current = setInterval(() => {
        setDisplaySeconds(getTotalSeconds(stateRef.current));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDisplaySeconds(state.elapsed);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.status, state.elapsed, state.lastResumedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Replay event listener
  useEffect(() => {
    function handleReplay(e: Event) {
      const data = (e as CustomEvent<ReplayData>).detail;
      if (stateRef.current.status !== "stopped") {
        setPendingReplay(data);
        setShowReplayConflict(true);
      } else {
        doStartFromReplay(data);
      }
    }
    window.addEventListener("apexio:replay", handleReplay);
    return () => window.removeEventListener("apexio:replay", handleReplay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function doStartFromReplay(data: ReplayData) {
    const now = Date.now();
    setState({
      ...DEFAULT_STATE,
      status: "running",
      originalStartedAt: now,
      lastResumedAt: now,
      description: data.description,
      osNumber: data.osNumber,
      projectId: data.projectId,
      billable: data.billable,
    });
    setDisplaySeconds(0);
  }

  function confirmReplay() {
    if (pendingReplay) {
      doStartFromReplay(pendingReplay);
      setPendingReplay(null);
      setShowReplayConflict(false);
    }
  }

  function handleStart() {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      status: "running",
      originalStartedAt: prev.originalStartedAt ?? now,
      lastResumedAt: now,
    }));
  }

  function handlePause() {
    const now = Date.now();
    setState((prev) => ({
      ...prev,
      status: "paused",
      elapsed:
        prev.elapsed +
        Math.floor((now - (prev.lastResumedAt ?? now)) / 1000),
      lastResumedAt: null,
    }));
  }

  function handleStop() {
    if (state.status === "running") {
      const now = Date.now();
      setState((prev) => ({
        ...prev,
        status: "paused",
        elapsed:
          prev.elapsed +
          Math.floor((now - (prev.lastResumedAt ?? now)) / 1000),
        lastResumedAt: null,
      }));
    }
    setShowStopModal(true);
  }

  async function handleSave(data: {
    description: string;
    osNumber: string;
    projectId: string;
    billable: boolean;
  }) {
    setSaving(true);
    const hours = displaySeconds / 3600;
    const startAt = state.originalStartedAt
      ? new Date(state.originalStartedAt)
      : new Date();
    const endAt = new Date();

    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        hours,
        description: data.description,
        osNumber: data.osNumber || undefined,
        billable: data.billable,
        projectId: data.projectId === NONE ? undefined : data.projectId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      }),
    });

    setSaving(false);
    setShowStopModal(false);
    setState(DEFAULT_STATE);
    setDisplaySeconds(0);
    setMobileExpanded(false);
    router.refresh();
  }

  function handleDiscard() {
    setShowStopModal(false);
    setState(DEFAULT_STATE);
    setDisplaySeconds(0);
    setMobileExpanded(false);
  }

  if (!hydrated) return null;

  const isRunning = state.status === "running";
  const isPaused = state.status === "paused";
  const isActive = isRunning || isPaused;

  const timeColor = isRunning
    ? "text-[#F97316]"
    : isPaused
    ? "text-[#00C9E0]"
    : "text-gray-400 dark:text-gray-500";

  const barBorder = isRunning
    ? "border-b-2 border-[#F97316]"
    : isPaused
    ? "border-b-2 border-[#00C9E0]"
    : "border-b border-gray-200 dark:border-gray-800";

  return (
    <>
      {/* ─── Desktop TimerBar ─── */}
      <div
        className={`hidden lg:flex items-center gap-3 px-6 h-14 bg-white dark:bg-gray-950 ${barBorder} z-20`}
      >
        <div className="flex-shrink-0">
          {isRunning ? (
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#F97316] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F97316]" />
            </span>
          ) : (
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                isPaused ? "bg-[#00C9E0]" : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          )}
        </div>

        <input
          type="text"
          value={state.description}
          onChange={(e) =>
            setState((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="No que você está trabalhando?"
          className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
        />

        <input
          type="text"
          value={state.osNumber}
          onChange={(e) =>
            setState((prev) => ({ ...prev, osNumber: e.target.value }))
          }
          placeholder="OS-1234"
          className="w-24 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none border-l border-gray-200 dark:border-gray-700 pl-3"
        />

        <div className="border-l border-gray-200 dark:border-gray-700 pl-3">
          <Select
            value={state.projectId}
            onValueChange={(v) =>
              setState((prev) => ({ ...prev, projectId: v }))
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs border-0 bg-transparent shadow-none px-0 focus:ring-0">
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sem projeto</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          onClick={() =>
            setState((prev) => ({ ...prev, billable: !prev.billable }))
          }
          className={`text-xs px-2 py-1 rounded border transition-colors ${
            state.billable
              ? "border-[#14B8A6] text-[#14B8A6] bg-[#14B8A6]/10"
              : "border-gray-200 dark:border-gray-700 text-gray-400"
          }`}
        >
          $
        </button>

        <span className={`font-mono text-sm font-semibold w-16 text-right ${timeColor}`}>
          {formatTime(displaySeconds)}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!isActive && (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors"
            >
              <Play className="h-3 w-3 fill-current" />
              Iniciar
            </button>
          )}
          {isRunning && (
            <button
              onClick={handlePause}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Pausar"
            >
              <Pause className="h-4 w-4" />
            </button>
          )}
          {isPaused && (
            <button
              onClick={handleStart}
              className="rounded-lg p-1.5 text-[#00C9E0] hover:bg-[#00C9E0]/10 transition-colors"
              title="Retomar"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
          )}
          {isActive && (
            <button
              onClick={handleStop}
              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              title="Parar"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Mobile TimerBar ─── */}
      <div className={`lg:hidden bg-white dark:bg-gray-950 ${barBorder}`}>
        <div className="flex items-center gap-3 px-4 h-11">
          <div className="flex-shrink-0">
            {isRunning ? (
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#F97316] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97316]" />
              </span>
            ) : (
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  isPaused ? "bg-[#00C9E0]" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            )}
          </div>

          <span className={`font-mono text-sm font-semibold ${timeColor}`}>
            {formatTime(displaySeconds)}
          </span>

          <input
            type="text"
            value={state.description}
            onChange={(e) =>
              setState((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="No que você está trabalhando?"
            className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 outline-none"
          />

          <div className="flex items-center gap-1 flex-shrink-0">
            {!isActive && (
              <button
                onClick={handleStart}
                className="rounded-lg p-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            )}
            {isRunning && (
              <button
                onClick={handlePause}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            {isPaused && (
              <button
                onClick={handleStart}
                className="rounded-lg p-1.5 text-[#00C9E0] hover:bg-[#00C9E0]/10"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            )}
            {isActive && (
              <button
                onClick={handleStop}
                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            )}
            <button
              onClick={() => setMobileExpanded((v) => !v)}
              className="rounded-lg p-1.5 text-gray-400"
            >
              {mobileExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {mobileExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nº da OS</Label>
                <Input
                  value={state.osNumber}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, osNumber: e.target.value }))
                  }
                  placeholder="OS-1234"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Projeto</Label>
                <Select
                  value={state.projectId}
                  onValueChange={(v) =>
                    setState((prev) => ({ ...prev, projectId: v }))
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Projeto" />
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
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mobile-billable"
                checked={state.billable}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, billable: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-[#F97316]"
              />
              <Label htmlFor="mobile-billable" className="text-sm">
                Faturável
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* ─── Stop modal ─── */}
      {showStopModal && (
        <StopModal
          timerState={state}
          displaySeconds={displaySeconds}
          projects={projects}
          onSave={handleSave}
          onDiscard={handleDiscard}
          saving={saving}
        />
      )}

      {/* ─── Replay conflict modal ─── */}
      {showReplayConflict && (
        <ReplayConflictModal
          onCancel={() => {
            setShowReplayConflict(false);
            setPendingReplay(null);
          }}
          onConfirm={confirmReplay}
        />
      )}
    </>
  );
}
