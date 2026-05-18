import { useMemo } from "react";
import { useTodoStats, useTodos } from "@/lib/queries";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { CheckCircle2, Circle, AlertTriangle, Flame, TrendingUp, Target, Sparkles, Calendar, Clock, Zap, GanttChart } from "lucide-react";

export function StatsPage() {
  useDocumentTitle("Analytics");
  const { data: stats, isLoading } = useTodoStats();
  const { data: todos } = useTodos();

  const metrics = useMemo(() => {
    if (!todos) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const overdue = todos.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now).length;
    const dueThisWeek = todos.filter((t) => {
      if (!t.dueDate || t.completed) return false;
      const d = new Date(t.dueDate);
      return d >= now && d <= new Date(now.getTime() + 7 * 86400000);
    }).length;
    const completedThisWeek = todos.filter((t) => t.completed && new Date(t.updatedAt) >= weekAgo).length;
    const noDueDate = todos.filter((t) => !t.dueDate).length;
    const highActive = todos.filter((t) => !t.completed && t.priority === "high").length;
    const avgCompletion = todos.length > 0 ? Math.round((todos.filter((t) => t.completed).length / todos.length) * 100) : 0;

    return { overdue, dueThisWeek, completedThisWeek, noDueDate, highActive, avgCompletion };
  }, [todos]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="animate-slide-up-fade">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground/60">Track your productivity</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.05}s` }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="animate-slide-up-fade">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Analytics
          <Sparkles className="h-4 w-4 text-amber-500" />
        </h1>
        <p className="text-sm text-muted-foreground/60">Track your productivity and progress</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up-fade animation-delay-100">
        <GlassCard>
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Completed</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats?.completed || 0}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">of {stats?.total || 0} tasks &middot; {stats?.percentage || 0}%</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Circle className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Active</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats?.active || 0}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">tasks remaining</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Overdue</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{metrics?.overdue || 0}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">past due date</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 text-sky-500 mb-2">
            <Flame className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Streak</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats?.streak || 0}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">days in a row</p>
        </GlassCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 animate-slide-up-fade animation-delay-100">
        <GlassCard>
          <div className="flex items-center gap-2 text-violet-500 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Due This Week</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{metrics?.dueThisWeek || 0}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">tasks due in the next 7 days</p>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">Done This Week</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{metrics?.completedThisWeek || 0}</p>
          <p className="text-xs text-muted-foreground/50 mt-1">tasks completed in the last 7 days</p>
        </GlassCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 animate-slide-up-fade animation-delay-200">
        <GlassCard>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Target className="h-3.5 w-3.5" />
            By Priority
          </h3>
          <div className="space-y-4">
            {(["high", "medium", "low"] as const).map((p) => {
              const count = stats?.byPriority[p] || 0;
              const max = Math.max(...Object.values(stats?.byPriority || {}), 1);
              return (
                <div key={p}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="capitalize font-medium text-foreground/60">{p}</span>
                    <span className="text-muted-foreground/40 tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700 ease-out animate-progress-fill", p === "high" ? "bg-red-500" : p === "medium" ? "bg-amber-500" : "bg-sky-500")}
                      style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" />
            Quick Stats
          </h3>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">High priority active</span>
              <span className="text-sm font-medium tabular-nums text-foreground">{metrics?.highActive || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">No due date</span>
              <span className="text-sm font-medium tabular-nums text-foreground">{metrics?.noDueDate || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Completion rate</span>
              <span className="text-sm font-medium tabular-nums text-foreground">{metrics?.avgCompletion || 0}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Today completed</span>
              <span className="text-sm font-medium tabular-nums text-foreground">{stats?.todayCompleted || 0}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="sm:col-span-1">
          <h3 className="mb-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
            <GanttChart className="h-3.5 w-3.5" />
            Progress
          </h3>
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-28 w-28 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                  strokeDasharray={`${stats?.percentage || 0} ${100 - (stats?.percentage || 0)}`}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums text-foreground">
                {stats?.percentage || 0}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground/50 text-center">
              {stats?.todayCompleted || 0} completed today
              {metrics?.highActive ? ` \u00b7 ${metrics.highActive} high priority` : ""}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
