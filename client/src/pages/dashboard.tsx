import { useState } from "react";
import { Link } from "react-router-dom";
import { useTodos, useTodoStats, useCreateTodo, useUpdateTodo, useDeleteTodo } from "@/lib/queries";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { formatRelativeDate, cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Plus, CheckCircle2, Circle, Trash2, Calendar, ListTodo, TrendingUp, Zap, Sparkles, Inbox,
  Flame, AlertTriangle, ArrowRight, Clock,
} from "lucide-react";

function fireConfetti() {
  const defaults = { spread: 60, ticks: 50, gravity: 0.5, decay: 0.94, startVelocity: 30 };
  confetti({ ...defaults, particleCount: 40, origin: { x: 0.5, y: 0.3 } });
  confetti({ ...defaults, particleCount: 25, origin: { x: 0.3, y: 0.3 } });
  confetti({ ...defaults, particleCount: 25, origin: { x: 0.7, y: 0.3 } });
}

const statConfig = [
  { icon: ListTodo, label: "Total Tasks", color: "text-primary", bg: "from-primary/20 to-primary/5" },
  { icon: TrendingUp, label: "Completed", color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-500/5" },
  { icon: Zap, label: "Progress", color: "text-amber-500", bg: "from-amber-500/20 to-amber-500/5" },
  { icon: Flame, label: "Streak", color: "text-orange-500", bg: "from-orange-500/20 to-orange-500/5" },
];

function StatCard({ icon: Icon, label, value, sub, color, bg }: { icon: typeof ListTodo; label: string; value: number | string; sub?: string; color: string; bg: string }) {
  return (
    <GlassCard className="group relative overflow-hidden p-5 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.01]">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", bg)} />
      <div className="relative flex items-center gap-4">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground/50 mt-0.5 truncate">{sub}</p>}
        </div>
      </div>
    </GlassCard>
  );
}

function NewTaskForm({ onSubmit, onCancel }: { onSubmit: (d: { title: string; priority: string; dueDate?: string }) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit({ title: title.trim(), priority, dueDate: dueDate || undefined });
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus required />
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
        <DatePicker label="Due date" value={dueDate} onChange={setDueDate} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={loading || !title.trim()}>
          {loading ? <span className="flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Creating...</span> : "Create task"}
        </Button>
      </div>
    </form>
  );
}

export function DashboardPage() {
  useDocumentTitle("Dashboard");
  const { data: todos, isLoading } = useTodos();
  const { data: stats } = useTodoStats();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const [newTodo, setNewTodo] = useState(false);

  const tasks = (todos || []).filter((t) => !t.completed);
  const done = (todos || []).filter((t) => t.completed);
  const overdue = (todos || []).filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const highPriority = tasks.filter((t) => t.priority === "high").length;

  const handleToggle = (t: { id: string; completed: boolean }) => {
    const willComplete = !t.completed;
    updateTodo.mutate(
      { id: t.id, completed: willComplete },
      {
        onSuccess: () => {
          toast.success(willComplete ? "Task completed" : "Task reopened");
          if (willComplete) fireConfetti();
        },
      }
    );
  };

  const handleDelete = (t: { id: string; title: string; priority: string; dueDate: string | null }) => {
    deleteTodo.mutate(t.id, {
      onSuccess: () => {
        toast("Task deleted", {
          description: `"${t.title}" was removed`,
          action: {
            label: "Undo",
            onClick: () => {
              createTodo.mutate({ title: t.title, priority: t.priority, dueDate: t.dueDate || undefined });
              toast.success("Task restored");
            },
          },
          duration: 5000,
        });
      },
    });
  };

  const statValues = [
    { value: stats?.total || 0, sub: `${stats?.active || 0} active` },
    { value: stats?.completed || 0, sub: `${stats?.todayCompleted || 0} today` },
    { value: `${stats?.percentage || 0}%`, sub: "of all tasks" },
    { value: stats?.streak || 0, sub: stats?.streak ? "days in a row" : "Complete daily" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-start justify-between animate-slide-up-fade">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
            <span className="ml-2 text-gradient text-3xl">.</span>
          </h1>
          <p className="text-sm text-muted-foreground/60 mt-1 flex items-center gap-2">
            <span>{stats?.active || 0} tasks remaining</span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span>{stats?.percentage || 0}% completed</span>
            {stats?.todayCompleted ? (
              <>
                <span className="text-muted-foreground/20">&bull;</span>
                <span className="text-emerald-500/70">{stats.todayCompleted} done today</span>
              </>
            ) : null}
          </p>
        </div>
        <Button onClick={() => setNewTodo(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((cfg, i) => (
          <div key={cfg.label} className="animate-slide-up-fade" style={{ animationDelay: `${i * 0.08}s` }}>
            <StatCard {...cfg} {...statValues[i]} />
          </div>
        ))}
      </div>

      {overdue > 0 && (
        <div className="animate-slide-up-fade animation-delay-200">
          <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 to-red-500/5 p-4 shadow-lg shadow-red-500/5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(0_100%_50%/0.08),transparent_60%)]" />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 shadow-sm">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-400">{overdue} task{overdue > 1 ? "s" : ""} overdue</p>
                <p className="text-xs text-red-400/60 mt-0.5">These tasks are past their due date</p>
              </div>
              <Link to="/todos?filter=active">
                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                  View <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-slide-up-fade animation-delay-100">
          <GlassCard className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
                  <ListTodo className="h-4 w-4 text-primary" />
                </div>
                Active Tasks
                {tasks.length > 0 && <span className="text-muted-foreground text-sm font-normal">&middot; {tasks.length}</span>}
              </h2>
              {tasks.length > 0 && (
                <Link to="/todos">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="px-6 pb-6">
              {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl shimmer" />)}</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                    <Inbox className="h-7 w-7 text-emerald-500/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground/80 mb-1">All done!</h3>
                  <p className="text-sm text-muted-foreground/50 mb-6">You&apos;ve completed all your tasks.</p>
                  <Button variant="outline" size="sm" onClick={() => setNewTodo(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add New Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {tasks.slice(0, 8).map((todo, i) => (
                    <div key={todo.id} className="group relative flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200 hover:bg-secondary/50 hover:pl-4 hover:shadow-sm"
                      style={{ animation: `slide-up-fade 0.3s ease-out ${i * 0.04}s both` }}>
                      <button onClick={() => handleToggle(todo)} className="shrink-0 text-muted-foreground/30 transition-all hover:text-primary active:scale-75">
                        <Circle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <span className="flex-1 text-sm text-foreground/80 font-medium truncate">{todo.title}</span>
                      <Badge priority={todo.priority} />
                      {todo.dueDate && (
                        <span className={cn(
                          "flex items-center gap-1.5 text-xs shrink-0 font-medium",
                          new Date(todo.dueDate) < new Date()
                            ? "text-red-400/70"
                            : "text-muted-foreground/50"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {formatRelativeDate(todo.dueDate)}
                        </span>
                      )}
                      <button onClick={() => handleDelete(todo)} className="shrink-0 text-muted-foreground/15 opacity-0 transition-all hover:text-destructive group-hover:opacity-100 active:scale-75">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        <div className="animate-slide-up-fade animation-delay-200">
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                Completed
                {done.length > 0 && <span className="text-muted-foreground text-sm font-normal ml-1">&middot; {done.length}</span>}
              </h2>
            </div>
            <div className="px-6 pb-6">
              {done.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                    <CheckCircle2 className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground/50">No completed tasks yet</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Complete a task to see it here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {done.slice(0, 6).map((todo, i) => (
                    <div key={todo.id} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all hover:bg-secondary/30"
                      style={{ animation: `slide-up-fade 0.3s ease-out ${i * 0.03}s both` }}>
                      <button onClick={() => handleToggle(todo)} className="shrink-0 text-emerald-500/50 transition-transform hover:text-emerald-500 active:scale-75">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <span className="flex-1 text-sm text-muted-foreground/50 line-through truncate">{todo.title}</span>
                    </div>
                  ))}
                  {done.length > 6 && (
                    <p className="pt-2 text-xs text-muted-foreground/30 text-center">+{done.length - 6} more completed tasks</p>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {highPriority > 0 && (
        <div className="animate-slide-up-fade animation-delay-300">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 shadow-sm">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground/80">{highPriority} high priority task{highPriority > 1 ? "s" : ""} need{highPriority > 1 ? "" : "s"} attention</p>
                <p className="text-xs text-muted-foreground/50 mt-0.5">Focus on high-priority items first</p>
              </div>
              <Link to="/todos">
                <Button size="sm" variant="outline">
                  View <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      )}

      <Modal open={newTodo} onClose={() => setNewTodo(false)} title="Create New Task">
        <NewTaskForm onSubmit={async (d) => { await createTodo.mutateAsync(d); toast.success("Task created"); setNewTodo(false); }} onCancel={() => setNewTodo(false)} />
      </Modal>
    </div>
  );
}
