import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import {
  ListTodo,
  LayoutDashboard,
  BarChart3,
  Settings,
  X,
  Crown,
} from "lucide-react";
import { useTodoStats } from "@/lib/queries";

const links = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/todos", label: "Tasks", icon: ListTodo },
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
          "fixed left-0 top-0 z-30 flex h-screen w-60 flex-col bg-[#5D3EBB] dark:bg-[#0E0C22]/85 dark:backdrop-blur-xl text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] border-r border-white/5 dark:border-border/30",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand / Logo */}
        <div className="relative flex h-20 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FED29C] dark:bg-[#7B5CFA]/20 text-[#5D3EBB] dark:text-[#7B5CFA] shadow-lg shadow-black/10 ring-1 ring-white/20 dark:ring-[#7B5CFA]/20">
            <Crown className="h-5 w-5 fill-current" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white dark:text-foreground flex items-center gap-0.5 uppercase">
              taskify
              <span className="h-1.5 w-1.5 rounded-full bg-[#FED29C] dark:bg-[#7B5CFA]" />
            </span>
            <span className="block text-[10px] text-white/50 dark:text-muted-foreground/50 font-medium tracking-wide">
              productivity hub
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 dark:text-muted-foreground/50 transition-all hover:bg-white/10 dark:hover:bg-secondary/40 hover:text-white dark:hover:text-foreground md:hidden active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/15 dark:bg-[#7B5CFA]/15 text-[#FED29C] dark:text-[#7B5CFA] font-bold shadow-sm"
                    : "text-white/70 dark:text-muted-foreground hover:bg-white/5 dark:hover:bg-secondary/40 hover:text-white dark:hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-white/10 dark:bg-[#7B5CFA]/10 text-[#FED29C] dark:text-[#7B5CFA]"
                        : "text-white/55 dark:text-muted-foreground/60 group-hover:text-white dark:group-hover:text-foreground"
                    )}
                  >
                    <link.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="truncate">{link.label}</span>
                  {link.to === "/todos" && stats && stats.active > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-lg bg-white/20 dark:bg-[#7B5CFA]/20 px-1.5 text-[10px] font-bold text-white dark:text-[#7B5CFA] shadow-sm">
                      {stats.active}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Workspace Status Info */}
        <div className="p-5 mt-auto">
          <div className="flex items-center justify-between text-[10px] text-white/40 dark:text-muted-foreground/45 font-medium border-t border-white/5 dark:border-border/15 pt-4">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span>Synced workspace</span>
            </div>
            <span>v1.2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
