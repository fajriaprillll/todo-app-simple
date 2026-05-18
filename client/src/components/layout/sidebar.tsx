import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  ListTodo,
  LayoutDashboard,
  BarChart3,
  Settings,
  X,
  Sparkles,
  Keyboard,
} from "lucide-react";
import { useTodoStats } from "@/lib/queries";
import { useState } from "react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/todos", label: "Todos", icon: ListTodo },
  { to: "/stats", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { data: stats } = useTodoStats();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={toggleSidebar}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border/40 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-black/20 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative flex h-14 items-center justify-between border-b border-border/40 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/80 to-purple-500 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-foreground/90">
                Todo App
              </span>
              <span className="block text-[10px] text-muted-foreground/40 font-medium tracking-wide">workspace</span>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/30 transition-all hover:bg-secondary hover:text-muted-foreground/60 md:hidden active:scale-90"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pt-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm"
                    : "text-muted-foreground/60 hover:bg-secondary/60 hover:text-foreground/80"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-purple-500 shadow-sm shadow-primary/50" />
                  )}
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
                  )}>
                    <link.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                  </div>
                  <span className="truncate">{link.label}</span>
                  {link.to === "/todos" && stats && stats.active > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-md bg-primary/20 px-1.5 text-[10px] font-semibold text-primary shadow-sm">
                      {stats.active}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border/40 p-3 space-y-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500/5 to-emerald-500/0 px-3 py-2.5 border border-emerald-500/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            </span>
            <span className="text-[11px] text-emerald-400/70 font-medium">Synced</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1">
            <kbd className="rounded-md border border-border/30 bg-secondary/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/40">?</kbd>
            <span className="text-[10px] text-muted-foreground/30 font-medium">Keyboard shortcuts</span>
          </div>
        </div>
      </aside>
    </>
  );
}
