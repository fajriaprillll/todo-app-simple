import { useState, useMemo } from "react";
import { useTodos, useTodoStats, useCreateTodo, useUpdateTodo, useDeleteTodo } from "@/lib/queries";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Plus, CheckCircle2, Circle, Trash2, Calendar as CalendarIcon, ListTodo, Inbox,
  Bell, ArrowLeft, ArrowRight as ChevronRight, Target, Flame, Zap, X
} from "lucide-react";

function fireConfetti() {
  const defaults = { spread: 60, ticks: 50, gravity: 0.5, decay: 0.94, startVelocity: 30 };
  confetti({ ...defaults, particleCount: 40, origin: { x: 0.5, y: 0.3 } });
  confetti({ ...defaults, particleCount: 25, origin: { x: 0.3, y: 0.3 } });
  confetti({ ...defaults, particleCount: 25, origin: { x: 0.7, y: 0.3 } });
}

function NewTaskForm({ onSubmit, onCancel, defaultDate }: { onSubmit: (d: { title: string; priority: string; dueDate?: string }) => Promise<void>; onCancel: () => void; defaultDate?: string }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(defaultDate || "");
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
        <Button type="submit" className="flex-1 bg-[#5D3EBB] hover:bg-[#4d32a3] text-white" disabled={loading || !title.trim()}>
          {loading ? <span className="flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Creating...</span> : "Create task"}
        </Button>
      </div>
    </form>
  );
}

export function DashboardPage() {
  useDocumentTitle("Home");
  const { data: todos, isLoading } = useTodos();
  const { data: stats } = useTodoStats();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const [newTodo, setNewTodo] = useState(false);
  const [defaultTaskDate, setDefaultTaskDate] = useState("");

  // Calendar State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Notification State
  const [showNotification, setShowNotification] = useState(true);

  // Active tasks
  const activeTodos = useMemo(() => todos || [], [todos]);

  // Selected date tasks (either scheduled or completed on this day)
  const selectedDateTasks = useMemo(() => {
    const startOfSelected = new Date(selectedDate);
    startOfSelected.setHours(0, 0, 0, 0);

    return activeTodos.filter((todo) => {
      if (todo.dueDate) {
        const todoDate = new Date(todo.dueDate);
        todoDate.setHours(0, 0, 0, 0);
        if (todoDate.getTime() === startOfSelected.getTime()) return true;
      }
      if (todo.completed && todo.updatedAt) {
        const compDate = new Date(todo.updatedAt);
        compDate.setHours(0, 0, 0, 0);
        if (compDate.getTime() === startOfSelected.getTime()) return true;
      }
      return false;
    });
  }, [activeTodos, selectedDate]);

  // Check completion progress for a date
  const getDateTaskStatus = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    
    const dayTasks = activeTodos.filter(t => {
      if (t.dueDate) {
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        if (due.getTime() === d.getTime()) return true;
      }
      if (t.completed && t.updatedAt) {
        const comp = new Date(t.updatedAt);
        comp.setHours(0, 0, 0, 0);
        if (comp.getTime() === d.getTime()) return true;
      }
      return false;
    });

    if (dayTasks.length === 0) return null;

    const completedCount = dayTasks.filter(t => t.completed).length;
    const totalCount = dayTasks.length;

    return {
      total: totalCount,
      completed: completedCount,
      allCompleted: completedCount === totalCount,
    };
  };

  // Render Calendar Month Grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prefix empty days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNum: prevTotalDays - i,
        date: new Date(year, month - 1, prevTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        dayNum: i,
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Suffix days to complete 6 weeks grid
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        dayNum: i,
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth]);

  const handleToggle = (t: { id: string; completed: boolean }) => {
    const willComplete = !t.completed;
    updateTodo.mutate(
      { id: t.id, completed: willComplete },
      {
        onSuccess: () => {
          toast.success(willComplete ? "Task completed!" : "Task reopened");
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

  // Month navigation helpers
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Notification helper
  const handleAssignTask = () => {
    createTodo.mutate({
      title: "Review workspace design changes",
      priority: "high",
      dueDate: new Date().toISOString()
    }, {
      onSuccess: () => {
        toast.success("Design task assigned successfully!");
        fireConfetti();
        setShowNotification(false);
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12 min-w-0">
      
      {/* LEFT COLUMN: Calendar & Productivity Metrics (7 columns) */}
      <div className="lg:col-span-7 space-y-6 min-w-0">
        
        {/* Calendar Card */}
        <GlassCard className="p-5 border border-border/40 shadow-sm animate-slide-up-fade">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#5D3EBB]" />
                Calendar Workspace
              </h2>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">Double click date to create task</p>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-xl hover:bg-secondary/50">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-secondary/40 border border-border/10 min-w-[110px] text-center">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-xl hover:bg-secondary/50">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-2.5">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Monthly grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const isSelected = selectedDate.toDateString() === cell.date.toDateString();
              const isToday = new Date().toDateString() === cell.date.toDateString();
              const taskStatus = getDateTaskStatus(cell.date);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  onDoubleClick={() => {
                    const formattedDate = cell.date.toISOString().split("T")[0];
                    setDefaultTaskDate(formattedDate);
                    setNewTodo(true);
                  }}
                  className={cn(
                    "relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all duration-200 group active:scale-90",
                    cell.isCurrentMonth ? "text-foreground" : "text-muted-foreground/35",
                    isSelected 
                      ? "bg-[#5D3EBB] dark:bg-[#7B5CFA] text-white dark:text-background shadow-md shadow-[#5D3EBB]/20" 
                      : isToday 
                        ? "bg-amber-400/20 text-amber-500 hover:bg-amber-400/30 border border-amber-400/30" 
                        : "hover:bg-secondary/40 text-foreground/80"
                  )}
                >
                  <span className={cn(taskStatus && "-mt-2")}>{cell.dayNum}</span>
                  {taskStatus && (
                    <div className="absolute bottom-1.5 flex items-center justify-center gap-0.5">
                      <span className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        taskStatus.allCompleted
                          ? (isSelected ? "bg-emerald-300 dark:bg-emerald-600" : "bg-emerald-500")
                          : (isSelected ? "bg-amber-300 dark:bg-amber-600" : "bg-[#5D3EBB] dark:bg-[#7B5CFA]")
                      )} />
                      <span className={cn(
                        "text-[8px] font-bold tabular-nums",
                        isSelected ? "text-white/80 dark:text-background/80" : "text-muted-foreground/60"
                      )}>
                        {taskStatus.completed}/{taskStatus.total}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </GlassCard>

        {/* Productivity Metrics Card (Alternative to Chat) */}
        <GlassCard className="p-5 border border-border/40 shadow-sm animate-slide-up-fade animation-delay-100">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Target className="h-4.5 w-4.5 text-[#5D3EBB]" />
            Workspace Productivity
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Completion Gauge */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-secondary/15 rounded-2xl border border-border/10">
              <div className="relative h-20 w-20 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
                    strokeDasharray={`${stats?.percentage || 0} ${100 - (stats?.percentage || 0)}`}
                    strokeLinecap="round" className="transition-all duration-700 ease-out" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-base font-extrabold tabular-nums text-foreground">
                  {stats?.percentage || 0}%
                </span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-2 text-center uppercase tracking-wider">Completion Rate</p>
            </div>

            {/* Daily Streak */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-secondary/15 rounded-2xl border border-border/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/20 text-amber-500 mb-1">
                <Flame className="h-6 w-6 fill-current animate-pulse" />
              </div>
              <p className="text-xl font-black text-foreground tabular-nums">{stats?.streak || 0}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 text-center uppercase tracking-wider">Daily Streak</p>
            </div>

            {/* Active Tasks stats */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-secondary/15 rounded-2xl border border-border/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 mb-1">
                <Zap className="h-5 w-5 fill-current" />
              </div>
              <p className="text-xl font-black text-foreground tabular-nums">{stats?.active || 0}</p>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 text-center uppercase tracking-wider">Active Tasks</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* RIGHT COLUMN: Notifications & Date Tasks List (5 columns) */}
      <div className="lg:col-span-5 space-y-6 min-w-0 flex flex-col justify-between">
        
        {/* Dynamic Notification Card */}
        {showNotification && (
          <GlassCard className="p-5 bg-gradient-to-br from-[#5D3EBB]/10 to-transparent dark:from-[#5D3EBB]/5 border border-[#5D3EBB]/15 relative overflow-hidden animate-slide-up-fade shrink-0">
            <div className="absolute top-1.5 right-1.5">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowNotification(false)} 
                className="h-6 w-6 text-muted-foreground/45 hover:text-foreground rounded-lg"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5D3EBB]/10 dark:bg-white/10 shadow-inner">
                <Bell className="h-5 w-5 text-[#5D3EBB] dark:text-[#FED29C]" />
              </div>
              <div className="flex-1 min-w-0 text-left pr-3">
                <h3 className="text-xs font-bold text-foreground/80">Pending Design Check</h3>
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed mt-1">
                  You have pending interface reviews for today. Press Assign to generate checklist items.
                </p>
                <Button 
                  onClick={handleAssignTask}
                  className="mt-3.5 h-8 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-[10px] shadow-sm transition-all"
                >
                  Assign Checklist
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Date Tasks checklist */}
        <GlassCard className="p-5 flex-1 flex flex-col min-h-[360px] overflow-hidden animate-slide-up-fade animation-delay-200 border border-border/40 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/15 pb-4 mb-4 shrink-0">
            <div className="text-left">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ListTodo className="h-4.5 w-4.5 text-[#5D3EBB]" />
                Scheduled Tasks
                <span className="text-xs text-muted-foreground/60 font-semibold">
                  ({selectedDateTasks.length})
                </span>
              </h2>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {selectedDate.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>

            <Button 
              size="sm"
              onClick={() => {
                const formattedDate = selectedDate.toISOString().split("T")[0];
                setDefaultTaskDate(formattedDate);
                setNewTodo(true);
              }}
              className="h-8 px-3 rounded-xl bg-[#5D3EBB] hover:bg-[#4d32a3] text-white flex items-center gap-1 shadow-md text-xs font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Task
            </Button>
          </div>

          {/* List scroll container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-left max-h-[350px]">
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl shimmer" />)}</div>
            ) : selectedDateTasks.length === 0 ? (
              <div className="text-center py-14 my-auto">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5D3EBB]/5 text-[#5D3EBB]/30">
                  <Inbox className="h-6 w-6" />
                </div>
                <h3 className="text-xs font-bold text-foreground/80 mb-0.5">No tasks scheduled</h3>
                <p className="text-[10px] text-muted-foreground/45">Double click calendar cell or press Add Task.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedDateTasks.map((todo, i) => (
                  <div 
                    key={todo.id} 
                    className={cn(
                      "group relative flex items-center gap-4 rounded-xl px-5 py-3.5 bg-secondary/15 dark:bg-secondary/5 hover:bg-secondary/35 border border-border/10 border-l-[4px] transition-all duration-200",
                      todo.priority === "high" 
                        ? "border-l-rose-500/60 dark:border-l-rose-500" 
                        : todo.priority === "medium" 
                          ? "border-l-amber-500/60 dark:border-l-amber-500" 
                          : "border-l-indigo-500/60 dark:border-l-indigo-500"
                    )}
                    style={{ animation: `slide-up-fade 0.3s ease-out ${i * 0.04}s both` }}
                  >
                    <button 
                      onClick={() => handleToggle(todo)} 
                      className="shrink-0 text-muted-foreground/35 transition-all hover:text-[#5D3EBB] active:scale-75"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 animate-check-pop" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 group-hover:scale-115 transition-transform" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-xs font-semibold truncate block", 
                        todo.completed ? "text-muted-foreground/40 line-through" : "text-foreground/80"
                      )}>
                        {todo.title}
                      </span>
                      {todo.description && (
                        <p className="text-[9px] text-muted-foreground/50 truncate mt-0.5">{todo.description}</p>
                      )}
                    </div>

                    <Badge priority={todo.priority as any} />
                    
                    <button 
                      onClick={() => handleDelete(todo)} 
                      className="shrink-0 text-muted-foreground/15 opacity-0 transition-all hover:text-destructive group-hover:opacity-100 active:scale-75 p-1 hover:bg-destructive/10 rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* New Task Modal */}
      <Modal open={newTodo} onClose={() => setNewTodo(false)} title="Create New Task">
        <NewTaskForm 
          defaultDate={defaultTaskDate}
          onSubmit={async (d) => { 
            await createTodo.mutateAsync(d); 
            toast.success("Task created successfully!"); 
            setNewTodo(false); 
          }} 
          onCancel={() => setNewTodo(false)} 
        />
      </Modal>
    </div>
  );
}
