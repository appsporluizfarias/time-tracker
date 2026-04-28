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
import { Plus, Pencil, Check, X, UserX, UserCheck } from "lucide-react";
import { format } from "date-fns";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "DEV" | "VIEWER";
  active: boolean;
  approved: boolean;
  createdAt: Date;
  _count: { timeEntries: number };
}

interface TeamClientProps {
  initialUsers: User[];
  currentUserId: string;
}

export function TeamClient({ initialUsers, currentUserId }: TeamClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "DEV" as "ADMIN" | "DEV" | "VIEWER",
  });

  const pending = initialUsers.filter((u) => !u.approved);
  const active = initialUsers.filter((u) => u.approved && u.active);
  const inactive = initialUsers.filter((u) => u.approved && !u.active);

  function openCreate() {
    setEditUser(null);
    setForm({ name: "", email: "", password: "", role: "DEV" });
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditUser(user);
    setForm({ name: user.name ?? "", email: user.email, password: "", role: user.role });
    setOpen(true);
  }

  async function handleSave() {
    if (editUser) {
      const body: Record<string, unknown> = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, approved: true }),
      });
    }
    setOpen(false);
    router.refresh();
  }

  async function patchStatus(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  async function handleApprove(id: string) {
    await patchStatus(id, { approved: true, active: true });
  }

  async function handleReject(id: string) {
    if (!confirm("Rejeitar este cadastro? O usuário será removido.")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleToggleActive(id: string, active: boolean) {
    await patchStatus(id, { active: !active });
  }

  async function handleRoleChange(id: string, role: string) {
    await patchStatus(id, { role });
  }

  const UserRow = ({ user }: { user: User }) => (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 sm:px-6 py-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name ?? "—"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 hidden sm:table-cell">
        <Select
          value={user.role}
          onValueChange={(v) => handleRoleChange(user.id, v)}
          disabled={user.id === currentUserId}
        >
          <SelectTrigger className="w-28 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="DEV">Dev</SelectItem>
            <SelectItem value="VIEWER">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
        <span className="text-sm text-gray-600 dark:text-gray-400">{user._count.timeEntries}</span>
      </td>
      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {format(new Date(user.createdAt), "dd/MM/yyyy")}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => openEdit(user)}
            className="rounded p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {user.id !== currentUserId && (
            <button
              onClick={() => handleToggleActive(user.id, user.active)}
              className={`rounded p-1.5 transition-colors ${
                user.active
                  ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                  : "text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
              }`}
              title={user.active ? "Desativar" : "Ativar"}
            >
              {user.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Convidar membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? "Editar usuário" : "Convidar membro"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" />
              </div>
              <div className="space-y-1.5">
                <Label>{editUser ? "Nova senha (deixe em branco para manter)" : "Senha provisória"}</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as "ADMIN" | "DEV" | "VIEWER" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="DEV">Dev</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!form.name || !form.email || (!editUser && !form.password)}>
                  {editUser ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending approval */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-white dark:border-amber-800 dark:bg-gray-900 overflow-hidden">
          <div className="border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 sm:px-6 py-3 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">{pending.length}</span>
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Aguardando aprovação</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {pending.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-4 sm:px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name ?? "—"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Cadastrado em {format(new Date(user.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button size="sm" onClick={() => handleApprove(user.id)}>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Aprovar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(user.id)} className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950">
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active users */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Membros ativos <span className="text-gray-400 font-normal">({active.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Membro</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Perfil</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Lançamentos</th>
                <th className="px-4 sm:px-6 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Entrou em</th>
                <th className="px-4 sm:px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {active.map((user) => <UserRow key={user.id} user={user} />)}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive users */}
      {inactive.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden opacity-75">
          <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Inativos <span className="font-normal">({inactive.length})</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {inactive.map((user) => <UserRow key={user.id} user={user} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
