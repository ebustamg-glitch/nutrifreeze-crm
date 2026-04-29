"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Users, Kanban, Mail, Calendar, BarChart3, Snowflake, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth";

const nav = [
  { href: "/", label: "Buscar Leads", icon: Search },
  { href: "/contactos", label: "Contactos", icon: Users },
  { href: "/pipeline", label: "Pipeline CRM", icon: Kanban },
  { href: "/campanas", label: "Campañas", icon: Mail },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export default function Sidebar({ user }: { user: SessionUser | null }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Snowflake className="text-cyan-400" size={22} />
          <span className="font-bold text-lg tracking-tight">NutriFreeze</span>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">Panel de ventas CDMX</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              path === href
                ? "bg-cyan-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700 space-y-3">
        {user && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-xs font-semibold capitalize">{user.username}</p>
              <p className="text-slate-500 text-xs capitalize">{user.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
        <p className="text-slate-500 text-xs">v1.0 · Datos DENUE INEGI</p>
      </div>
    </aside>
  );
}
