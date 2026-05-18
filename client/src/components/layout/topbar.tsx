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
  Sparkles,
} from "lucide-react";

export function Topbar() {
  const { toggleSidebar, theme, setTheme, setCommandPaletteOpen } = useAppStore();
  const { user, logout } = useAuthStore();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/40 bg-background/70 px-4 backdrop-blur-2xl shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground/50 hover:text-foreground">
          <Menu className="h-4 w-4" />
        </Button>
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="group relative flex items-center gap-2.5 rounded-xl border border-border/40 bg-secondary/30 px-3.5 py-1.5 text-xs text-muted-foreground/50 transition-all duration-200 hover:border-border/60 hover:bg-secondary/50 hover:text-muted-foreground/70 active:scale-[0.97]"
        >
          <Search className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
          <span className="hidden sm:inline">Search todos...</span>
          <span className="sm:hidden">Search...</span>
          <div className="ml-2 flex items-center gap-1">
            <kbd className="rounded-md border border-border/40 bg-secondary/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/30">⌘</kbd>
            <kbd className="rounded-md border border-border/40 bg-secondary/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground/30">K</kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-muted-foreground/50 hover:text-foreground">
          <div className="relative h-4 w-4">
            <Sun className={cn("absolute inset-0 h-4 w-4 transition-all duration-300", theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
            <Moon className={cn("absolute inset-0 h-4 w-4 transition-all duration-300", theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
          </div>
        </Button>

        <div className="relative" ref={avatarRef}>
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className={cn(
              "ml-1 flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-secondary/50 active:scale-95",
              avatarOpen && "bg-secondary/50"
            )}
          >
            <div className="relative">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/80 to-purple-500 text-[9px] font-semibold text-primary-foreground shadow-lg shadow-primary/30 ring-1 ring-primary/20">
                {getInitials(user?.name || user?.email)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-[1.5px] border-background bg-emerald-500 shadow-sm" />
            </div>
            <ChevronDown className={cn("hidden h-3 w-3 text-muted-foreground/40 transition-transform duration-200 sm:block", avatarOpen && "rotate-180")} />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-48 animate-scale-in rounded-xl border border-border/40 bg-card/90 backdrop-blur-2xl py-1 shadow-2xl shadow-black/20">
              <div className="border-b border-border/40 px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground/80 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground/50 truncate">{user?.email}</p>
              </div>
              <button onClick={() => { setAvatarOpen(false); setCommandPaletteOpen(true); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground/60 transition-all hover:bg-secondary/50 hover:text-foreground/80">
                <Search className="h-3.5 w-3.5" />
                Quick search
                <kbd className="ml-auto rounded-md border border-border/40 px-1.5 py-0.5 text-[9px] text-muted-foreground/30">⌘K</kbd>
              </button>
              <button onClick={() => { setAvatarOpen(false); logout(); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-destructive/70 transition-all hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
