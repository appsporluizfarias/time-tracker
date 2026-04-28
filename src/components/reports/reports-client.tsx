"use client";

import { useState, useEffect, useCallback } from "react";
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
import { formatHours } from "@/lib/utils";
import { Download, BarChart3 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const ALL = "all";

interface SummaryItem {
  id: string;
  name: string;
  hours: number;
  billableHours: number;
  count: number;
}

interface ReportsClientProps {
  projects: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  users: { id: string; name: string | null; email: string }[];
  isAdmin: boolean;
  currentUserId: string;
}

export function ReportsClient({ projects, users, isAdmin }: ReportsClientProps) {
  const now = new Date();
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(now), "yyyy-MM-dd"),
    endDate: format(endOfMonth(now), "yyyy-MM-dd"),
    projectId: ALL,
    userId: ALL,
    groupBy: "project",
  });
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      startDate: new Date(filters.startDate).toISOString(),
      endDate: new Date(filters.endDate).toISOString(),
      groupBy: filters.groupBy,
      ...(filters.projectId !== ALL && { projectId: filters.projectId }),
      ...(filters.userId !== ALL && { userId: filters.userId }),
    });
    const res = await fetch(`/api/reports/summary?${params}`);
    const data = await res.json();
    setSummary(data);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  function handleExport() {
    const params = new URLSearchParams({
      startDate: new Date(filters.startDate).toISOString(),
      endDate: new Date(filters.endDate).toISOString(),
      ...(filters.projectId !== ALL && { projectId: filters.projectId }),
      ...(filters.userId !== ALL && { userId: filters.userId }),
    });
    window.location.href = `/api/reports/export?${params}`;
  }

  const totalHours = summary.reduce((acc, s) => acc + Number(s.hours), 0);
  const totalBillable = summary.reduce((acc, s) => acc + Number(s.billableHours), 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Data início</Label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Data fim</Label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="text-base"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Agrupar por</Label>
            <Select value={filters.groupBy} onValueChange={(v) => setFilters({ ...filters, groupBy: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Projeto</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="sprint">Sprint</SelectItem>
                {isAdmin && <SelectItem value="user">Usuário</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Projeto</Label>
            <Select
              value={filters.projectId}
              onValueChange={(v) => setFilters({ ...filters, projectId: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos os projetos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <div className="space-y-1.5">
              <Label>Usuário</Label>
              <Select
                value={filters.userId}
                onValueChange={(v) => setFilters({ ...filters, userId: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name ?? u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total de Horas", value: formatHours(totalHours) },
          { label: "Horas Faturáveis", value: formatHours(totalBillable) },
          {
            label: "Taxa Faturável",
            value: totalHours > 0 ? `${Math.round((totalBillable / totalHours) * 100)}%` : "—",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumo por {filters.groupBy === "project" ? "projeto" : filters.groupBy === "client" ? "cliente" : filters.groupBy === "sprint" ? "sprint" : "usuário"}
          </h2>
        </div>
        {loading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">Carregando…</div>
        ) : summary.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Nenhum dado para o período selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Nome</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Entradas</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Total</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Faturável</th>
                  <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {summary
                  .sort((a, b) => Number(b.hours) - Number(a.hours))
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{item.count}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-900 dark:text-white">{formatHours(Number(item.hours))}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600 dark:text-gray-400 hidden sm:table-cell">{formatHours(Number(item.billableHours))}</td>
                      <td className="px-4 sm:px-6 py-4 text-gray-600 dark:text-gray-400">
                        {Number(item.hours) > 0 ? `${Math.round((Number(item.billableHours) / Number(item.hours)) * 100)}%` : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
