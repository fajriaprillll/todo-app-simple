import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { Moon, Sun, LogOut, User, Palette, Shield, Bell, Settings } from "lucide-react";

export function SettingsPage() {
  useDocumentTitle("Settings");
  const { theme, setTheme } = useAppStore();
  const { user, logout } = useAuthStore();

  const sections = [
    {
      title: "Profile", icon: User,
      content: (
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5D3EBB] to-purple-500 text-xl font-bold text-white shadow-lg shadow-[#5D3EBB]/20">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold text-foreground/80 truncate">{user?.name || "Unnamed"}</p>
            <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Appearance", icon: Palette,
      content: (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9.5 w-9.5 items-center justify-center rounded-xl bg-secondary/40 border border-border/10">
              {theme === "dark" ? <Moon className="h-4.5 w-4.5 text-muted-foreground" /> : <Sun className="h-4.5 w-4.5 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-foreground/80">Theme</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{theme === "dark" ? "Dark mode active" : "Light mode active"}</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn("relative h-7 w-12 rounded-full transition-colors duration-300 border border-border/10", theme === "dark" ? "bg-[#5D3EBB] dark:bg-[#7B5CFA]" : "bg-secondary")}
          >
            <span className={cn("absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-md transition-all duration-300", theme === "dark" ? "left-[22px]" : "left-0.5")}>
              {theme === "dark" ? <Moon className="h-3.5 w-3.5 text-[#5D3EBB] dark:text-[#7B5CFA]" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
            </span>
          </button>
        </div>
      ),
    },
    {
      title: "Notifications", icon: Bell,
      content: (
        <div className="text-left">
          <p className="text-xs font-semibold text-muted-foreground/60 leading-relaxed">
            Workspace email digest and task alarm settings are configured by default. Further preference settings coming soon.
          </p>
        </div>
      ),
    },
    {
      title: "Account Security", icon: Shield,
      content: (
        <div className="space-y-3.5 text-left">
          <p className="text-xs font-semibold text-muted-foreground/60">
            Sign out of your account on this device. Your local tasks are securely synced with the database.
          </p>
          <Button variant="danger" onClick={logout} className="h-8.5 px-4 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md">
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Sign Out
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      
      {/* Title */}
      <div className="animate-slide-up-fade">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-5.5 w-5.5 text-[#5D3EBB]" />
          Workspace Settings
          <span className="text-[#5D3EBB] text-xl font-bold">.</span>
        </h1>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Manage your account preferences and customize your interface</p>
      </div>

      {/* Cards list */}
      <div className="space-y-4">
        {sections.map((section, i) => (
          <GlassCard 
            key={section.title} 
            className="animate-slide-up-fade p-5 border border-border/40 shadow-sm" 
            style={{ animationDelay: `${0.05 + i * 0.08}s` }}
          >
            <div className="flex items-center gap-2 mb-4 border-b border-border/10 pb-2">
              <section.icon className="h-4.5 w-4.5 text-[#5D3EBB]/60" />
              <h2 className="text-xs font-bold text-foreground/80">{section.title}</h2>
            </div>
            {section.content}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
