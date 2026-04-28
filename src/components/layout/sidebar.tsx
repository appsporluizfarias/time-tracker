"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Clock,
  FolderOpen,
  BarChart3,
  Code2,
  Settings,
  LogOut,
  Users,
  Zap,
  Timer,
  Menu,
  X,
  Building2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "Lançar Horas", icon: Clock, roles: ["ADMIN", "DEV"] },
  { href: "/entries", label: "Time Entries", icon: ClipboardList, roles: ["ADMIN", "DEV"] },
  { href: "/projects", label: "Projetos", icon: FolderOpen },
  { href: "/clients", label: "Clientes", icon: Building2, roles: ["ADMIN"] },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/admin/team", label: "Equipe", icon: Users, roles: ["ADMIN"] },
  { href: "/webhooks", label: "Webhooks", icon: Zap, roles: ["ADMIN"] },
  { href: "/api/docs", label: "API Docs", icon: Code2 },
  { href: "/settings", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  userRole: Role;
  userName: string;
  userEmail: string;
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[rgba(0,201,224,0.12)] text-white border-l-2 border-[#00C9E0] pl-[10px]"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function UserFooter({
  userName,
  userEmail,
  userRole,
  compact,
}: {
  userName: string;
  userEmail: string;
  userRole: Role;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-t border-white/10",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="mb-3">
        <p className="text-sm font-medium text-white truncate">{userName}</p>
        {!compact && (
          <p className="text-xs text-white/50 truncate">{userEmail}</p>
        )}
        <span className="mt-1 inline-block rounded-full bg-[#00C9E0]/20 px-2 py-0.5 text-xs font-medium text-[#00C9E0]">
          {userRole}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/8 hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4 flex-shrink-0" />
        Sair
      </button>
    </div>
  );
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  return (
    <>
      {/* ─── Mobile top bar ─── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0F1C2E] px-4">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-[#00C9E0]" />
          <span className="text-base font-bold text-white">Apexio Timer</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ─── Mobile overlay + drawer ─── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex w-72 flex-col bg-[#0F1C2E] border-r border-white/10 h-full">
            <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-[#00C9E0]" />
                <span className="text-base font-bold text-white">Apexio Timer</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              <NavList
                items={visible}
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
            <UserFooter
              userName={userName}
              userEmail={userEmail}
              userRole={userRole}
            />
          </aside>
        </div>
      )}

      {/* ─── Desktop sidebar ─── */}
      <aside className="hidden lg:flex h-screen w-64 flex-col bg-[#0F1C2E] border-r border-white/10 flex-shrink-0">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <Timer className="h-6 w-6 text-[#00C9E0]" />
          <span className="text-lg font-bold text-white">Apexio Timer</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavList items={visible} pathname={pathname} />
        </nav>
        <UserFooter
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />
      </aside>
    </>
  );
}
