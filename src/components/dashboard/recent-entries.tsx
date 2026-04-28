"use client";

import { format } from "date-fns";
import { formatHours } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2, ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Entry {
  id: string;
  date: Date;
  hours: unknown;
  description: string | null;
  billable: boolean;
  osNumber?: string | null;
  userId: string;
  user: { id: string; name: string | null };
  project: { id: string; name: string; color: string } | null;
  client: { id: string; name: string } | null;
  task: { id: string; title: string } | null;
}

interface RecentEntriesProps {
  entries: Entry[];
  currentUserId: string;
  userRole: string;
}

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

function MobileRow({
  entry,
  canDelete,
  onDelete,
}: {
  entry: Entry;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <ReplayButton entry={entry} />
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.project?.color ?? "#6366f1" }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {entry.project?.name ?? "Sem projeto"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(entry.date), "dd/MM/yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatHours(Number(entry.hours))}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/30">
          {entry.task && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Tarefa:</span> {entry.task.title}
            </p>
          )}
          {entry.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Descrição:</span> {entry.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Badge variant={entry.billable ? "success" : "outline"} className="text-xs">
              {entry.billable ? "Faturável" : "Não faturável"}
            </Badge>
            {canDelete && (
              <button
                onClick={() => onDelete(entry.id)}
                className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RecentEntries({ entries, currentUserId, userRole }: RecentEntriesProps) {
  const router = useRouter();

  const canDelete = (entry: Entry) =>
    userRole === "ADMIN" || entry.userId === currentUserId;

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Nenhum lançamento ainda. Comece registrando suas horas!
      </div>
    );
  }

  return (
    <>
      {/* Mobile: expandable cards */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
        {entries.map((entry) => (
          <MobileRow
            key={entry.id}
            entry={entry}
            canDelete={canDelete(entry)}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Desktop: full table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-8" />
              <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Data</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Projeto</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Tarefa</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Horas</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Faturável</th>
              {userRole !== "DEV" && (
                <th className="px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                  Usuário
                </th>
              )}
              <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
              >
                <td className="pl-4 pr-1 py-4">
                  <ReplayButton entry={entry} />
                </td>
                <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {format(new Date(entry.date), "dd/MM/yyyy")}
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.project?.color ?? "#6366f1" }}
                    />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {entry.project?.name ?? "Sem projeto"}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 hidden md:table-cell">
                  {entry.task?.title ?? "—"}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {formatHours(Number(entry.hours))}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={entry.billable ? "success" : "outline"}>
                    {entry.billable ? "Sim" : "Não"}
                  </Badge>
                </td>
                {userRole !== "DEV" && (
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                    {entry.user.name ?? "—"}
                  </td>
                )}
                <td className="px-6 py-4">
                  {canDelete(entry) && (
                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer link */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-3 flex justify-end">
        <Link
          href="/entries"
          className="flex items-center gap-1.5 text-sm text-[#00C9E0] hover:text-[#009AB0] font-medium transition-colors"
        >
          Ver todas
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  );
}
