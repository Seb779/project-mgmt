"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Kanban,
  FileText,
  Settings,
  Users,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

const PHASES = [
  { label: "Initialisation", emoji: "🔷" },
  { label: "Conception", emoji: "💡" },
  { label: "Réalisation", emoji: "⚙️" },
  { label: "Déploiement", emoji: "🚀" },
  { label: "Clôture", emoji: "✅" },
];

const NAV = [
  { label: "Portefeuille", href: "/", icon: LayoutDashboard },
  { label: "Planner", href: "/planner", icon: Kanban },
  { label: "Documents", href: "/documents", icon: FileText },
];

const ADMIN = [
  { label: "Paramétrage", href: "/settings", icon: Settings },
  { label: "Utilisateurs", href: "/users", icon: Users },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="font-bold text-blue-700 text-sm tracking-wide">
          HERMES Portal
        </div>
        <div className="text-[10px] text-gray-400 mt-0.5">v1.0 — HERMES 5.1</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {/* Main nav */}
        <div className="px-3 pt-2 pb-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Navigation
          </p>
          {NAV.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors",
                path === href
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </div>

        {/* Phases HERMES */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Phases HERMES
          </p>
          {PHASES.map(({ label, emoji }) => (
            <button
              key={label}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors mb-0.5"
            >
              <span>{emoji}</span>
              {label}
              <ChevronRight size={11} className="ml-auto" />
            </button>
          ))}
        </div>

        {/* Admin */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Admin
          </p>
          {ADMIN.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-800 mb-0.5 transition-colors"
            >
              <Icon size={13} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-3 border-t border-gray-200 text-[10px] text-gray-400">
        <div className="font-medium text-gray-600 text-xs">Seb Gerber</div>
        <div>Chef de projet</div>
        <div>claude@ifotech.ch</div>
      </div>
    </aside>
  );
}
