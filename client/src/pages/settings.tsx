import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { Moon, Sun, LogOut, User, Palette, Shield, Sparkles, Bell } from "lucide-react";

export function SettingsPage() {
  useDocumentTitle("Settings");
  const { theme, setTheme } = useAppStore();
  const { user, logout } = useAuthStore();

  const sections = [
    {
      title: "Profile", icon: User,
      content: (
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-xl font-semibold text-primary-foreground shadow-xl shadow-primary/20">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="text-base font-medium text-foreground/80 truncate">{user?.name || "Unnamed"}</p>
            <p className="text-sm text-muted-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Appearance", icon: Palette,
      content: (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/80">Theme</p>
              <p className="text-xs text-muted-foreground/60">{theme === "dark" ? "Dark mode" : "Light mode"}</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn("relative h-7 w-12 rounded-full transition-colors duration-300", theme === "dark" ? "bg-primary" : "bg-secondary")}
          >
            <span className={cn("absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-lg transition-all duration-300", theme === "dark" ? "left-5" : "left-0.5")}>
              {theme === "dark" ? <Moon className="h-3 w-3 text-primary" /> : <Sun className="h-3 w-3 text-amber-500" />}
            </span>
          </button>
        </div>
      ),
    },
    {
      title: "Notifications", icon: Bell,
      content: (
        <p className="text-sm text-muted-foreground/60">
          Notification preferences coming soon
        </p>
      ),
    },
    {
      title: "Account", icon: Shield,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground/60">
            Sign out of your account on this device
          </p>
          <Button variant="danger" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-slide-up-fade">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Settings
          <Sparkles className="h-4 w-4 text-amber-500" />
        </h1>
        <p className="text-sm text-muted-foreground/60">Manage your preferences</p>
      </div>

      {sections.map((section, i) => (
        <GlassCard key={section.title} className="animate-slide-up-fade" style={{ animationDelay: `${0.05 + i * 0.08}s` }}>
          <div className="flex items-center gap-2 mb-4">
            <section.icon className="h-4 w-4 text-muted-foreground/50" />
            <h2 className="text-sm font-semibold text-foreground/70">{section.title}</h2>
          </div>
          {section.content}
        </GlassCard>
      ))}
    </div>
  );
}
