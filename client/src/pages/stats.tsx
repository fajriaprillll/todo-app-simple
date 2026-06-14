import { useMemo } from "react";
import { useTodoStats, useTodos } from "@/lib/queries";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { CheckCircle2, Circle, AlertTriangle, Flame, Target, Sparkles, Calendar, Clock, Zap, BarChart3 } from "lucide-react";

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
          <h1 className="text-xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-[10px] text-muted-foreground/60">Gathering statistics...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.05}s` }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* Title */}
      <div className="animate-slide-up-fade">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BarChart3 className="h-5.5 w-5.5 text-[#5D3EBB]" />
          Productivity Analytics
          <span className="text-[#5D3EBB] text-xl font-bold">.</span>
        </h1>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Real-time statistics of your workspace performance</p>
      </div>

      {/* Metric Cards Row */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up-fade animation-delay-100">
        <GlassCard className="p-4 border border-border/40 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Completed</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats?.completed || 0}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">of {stats?.total || 0} tasks &middot; {stats?.percentage || 0}% rate</p>
        </GlassCard>

        <GlassCard className="p-4 border border-border/40 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-2 text-[#5D3EBB] mb-2">
            <Circle className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats?.active || 0}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">tasks remaining</p>
        </GlassCard>

        <GlassCard className="p-4 border border-border/40 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-2 text-rose-500 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Overdue</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{metrics?.overdue || 0}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">past scheduled date</p>
        </GlassCard>

        <GlassCard className="p-4 border border-border/40 shadow-sm relative overflow-hidden group hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Flame className="h-4 w-4" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{stats?.streak || 0}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">daily completion streak</p>
        </GlassCard>
      </div>

      {/* Week statistics */}
      <div className="grid gap-3.5 sm:grid-cols-2 animate-slide-up-fade animation-delay-100">
        <GlassCard className="p-4.5 border border-border/40 shadow-sm">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Calendar className="h-4.5 w-4.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Due This Week</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{metrics?.dueThisWeek || 0}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">tasks scheduled for next 7 days</p>
        </GlassCard>

        <GlassCard className="p-4.5 border border-border/40 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Clock className="h-4.5 w-4.5" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Done This Week</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{metrics?.completedThisWeek || 0}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">tasks completed in the last 7 days</p>
        </GlassCard>
      </div>

      {/* Detailed charts */}
      <div className="grid gap-4 sm:grid-cols-3 animate-slide-up-fade animation-delay-200">
        {/* By Priority */}
        <GlassCard className="p-4.5 border border-border/40 shadow-sm">
          <h3 className="mb-4 text-xs font-bold text-muted-foreground/75 flex items-center gap-2">
            <Target className="h-4 w-4" />
            By Priority
          </h3>
          <div className="space-y-4">
            {(["high", "medium", "low"] as const).map((p) => {
              const count = stats?.byPriority[p] || 0;
              const max = Math.max(...Object.values(stats?.byPriority || {}), 1);
              return (
                <div key={p}>
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="capitalize text-foreground/60">{p}</span>
                    <span className="text-muted-foreground/45 tabular-nums">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out animate-progress-fill", 
                        p === "high" ? "bg-rose-500" : p === "medium" ? "bg-amber-400" : "bg-sky-400"
                      )}
                      style={{ width: `${(count / max) * 100}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Quick Stats */}
        <GlassCard className="p-4.5 border border-border/40 shadow-sm">
          <h3 className="mb-4 text-xs font-bold text-muted-foreground/75 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium py-0.5">
              <span className="text-foreground/60">High priority active</span>
              <span className="tabular-nums text-foreground">{metrics?.highActive || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium py-0.5">
              <span className="text-foreground/60">No due date</span>
              <span className="tabular-nums text-foreground">{metrics?.noDueDate || 0}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium py-0.5">
              <span className="text-foreground/60">Completion rate</span>
              <span className="tabular-nums text-foreground">{metrics?.avgCompletion || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium py-0.5">
              <span className="text-foreground/60">Today completed</span>
              <span className="tabular-nums text-foreground">{stats?.todayCompleted || 0}</span>
            </div>
          </div>
        </GlassCard>

        {/* Progress gauge */}
        <GlassCard className="p-4.5 border border-border/40 shadow-sm flex flex-col items-center justify-between">
          <h3 className="mb-2.5 text-xs font-bold text-muted-foreground/75 flex items-center gap-2 self-start">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Total Progress
          </h3>
          
          <div className="flex flex-col items-center gap-4 my-auto">
            <div className="relative h-24 w-24 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#5D3EBB" strokeWidth="2.5"
                  strokeDasharray={`${stats?.percentage || 0} ${100 - (stats?.percentage || 0)}`}
                  strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums text-foreground">
                {stats?.percentage || 0}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
              {stats?.todayCompleted || 0} tasks completed today.<br />
              {metrics?.highActive ? `${metrics.highActive} high priority active.` : ""}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
