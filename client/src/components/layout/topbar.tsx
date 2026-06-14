import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import {
  Menu,
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";
import { useTodos } from "@/lib/queries";

export function Topbar() {
  const { toggleSidebar, theme, setTheme, setCommandPaletteOpen } = useAppStore();
  const { user, logout } = useAuthStore();
  const { data: todos } = useTodos();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const activeTodos = (todos || []).filter((t) => !t.completed);
  const hasNotifications = activeTodos.some(
    (t) => t.dueDate && new Date(t.dueDate) < new Date()
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    if (avatarOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [avatarOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-border/20 bg-background/50 px-6 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Toggle Sidebar mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden text-muted-foreground/60 hover:text-foreground active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Welcome Pill */}
        <div className="flex items-center gap-2 rounded-full bg-[#5D3EBB]/10 dark:bg-white/10 px-4.5 py-2 text-xs font-semibold text-[#5D3EBB] dark:text-[#FED29C]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5D3EBB] dark:bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5D3EBB] dark:bg-amber-400" />
          </span>
          <span>Welcome, {user?.name || "User"}!</span>
        </div>

        {/* Desktop Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-2.5 rounded-2xl border border-border/40 bg-secondary/30 px-4 py-2 text-xs text-muted-foreground/50 transition-all duration-200 hover:border-border/60 hover:bg-secondary/50 hover:text-muted-foreground/70 active:scale-[0.97]"
        >
          <Search className="h-4 w-4 text-muted-foreground/40" />
          <span>Search tasks...</span>
          <kbd className="ml-2 rounded-lg border border-border/40 bg-secondary/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/30">⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCommandPaletteOpen(true)}
          className="md:hidden text-muted-foreground/60 hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground/60 hover:text-foreground rounded-2xl flex items-center justify-center h-10 w-10 shrink-0"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-[#5D3EBB]" />
          )}
        </Button>

        {/* Notification Bell */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="relative flex h-10 w-10 items-center justify-center rounded-2xl text-muted-foreground/60 hover:text-foreground transition-all hover:bg-secondary/40 active:scale-95"
        >
          <Bell className="h-5 w-5" />
          {hasNotifications && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-background bg-rose-500 shadow-sm" />
          )}
        </button>

        {/* Profile Avatar & Details Dropdown */}
        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-2.5 py-1.5 transition-all duration-200 hover:bg-secondary/50 active:scale-95",
              avatarOpen && "bg-secondary/50"
            )}
          >
            <div className="relative">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#5D3EBB] to-purple-500 text-[10px] font-bold text-white shadow-md ring-1 ring-white/20">
                {getInitials(user?.name || user?.email)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-background bg-emerald-500 shadow-sm" />
            </div>
            
            <div className="hidden sm:flex flex-col items-start text-left">
              <span className="text-xs font-semibold text-foreground/80 leading-none">
                {user?.name || "User"}
              </span>
              <span className="text-[10px] text-muted-foreground/50 truncate max-w-[110px] mt-0.5">
                {user?.email}
              </span>
            </div>

            <ChevronDown className={cn("hidden h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200 sm:block", avatarOpen && "rotate-180")} />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 animate-scale-in rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl py-1.5 shadow-2xl shadow-black/15">
              <div className="border-b border-border/40 px-4 py-3">
                <p className="text-xs font-bold text-foreground/80 truncate">{user?.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{user?.email}</p>
              </div>
              
              <button
                onClick={() => { setAvatarOpen(false); setCommandPaletteOpen(true); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-muted-foreground/70 transition-all hover:bg-secondary/50 hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                Quick Search
                <kbd className="ml-auto rounded border border-border/40 px-1 text-[9px] text-muted-foreground/35">⌘K</kbd>
              </button>

              <button
                onClick={() => { setAvatarOpen(false); logout(); }}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs text-rose-500 font-medium transition-all hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

