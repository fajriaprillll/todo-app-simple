import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useCreateFocusSession, useFocusHistory, useFocusStats, useTodos } from "@/lib/queries";
import { useAppStore } from "@/stores/app-store";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Flame,
  History,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";

const DEFAULT_FOCUS_MIN = 25;
const DEFAULT_BREAK_MIN = 5;

type TimerMode = "focus" | "break";

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function notify(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body });
}

function playChimeSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (time: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };
    
    const now = ctx.currentTime;
    playTone(now, 659.25, 0.45); // E5
    playTone(now + 0.25, 880.00, 0.65); // A5
  } catch (e) {
    console.error("Audio chime failed to play:", e);
  }
}

export function FocusPage() {
  useDocumentTitle("Focus");
  const { data: todos, isLoading: todosLoading } = useTodos();
  const { data: history, isLoading: historyLoading, isError: historyError } = useFocusHistory();
  const { data: stats, isLoading: statsLoading } = useFocusStats();
  const createSession = useCreateFocusSession();
  const { focusMode, setFocusMode } = useAppStore();
  const [mode, setMode] = useState<TimerMode>("focus");

  const [focusMin, setFocusMin] = useState(DEFAULT_FOCUS_MIN);
  const [breakMin, setBreakMin] = useState(DEFAULT_BREAK_MIN);

  // Controlled inputs for manual typing
  const [focusInput, setFocusInput] = useState(DEFAULT_FOCUS_MIN.toString());
  const [breakInput, setBreakInput] = useState(DEFAULT_BREAK_MIN.toString());

  const focusSeconds = focusMin * 60;
  const breakSeconds = breakMin * 60;

  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_MIN * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState<string>("");
  const focusStartedAt = useRef<Date | null>(null);
  const activeTodos = useMemo(() => (todos || []).filter((todo) => !todo.completed), [todos]);
  const activeTodo = activeTodos.find((todo) => todo.id === selectedTodoId) || null;
  const totalSeconds = mode === "focus" ? focusSeconds : breakSeconds;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 118;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const requestNotifications = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const recordFocusSession = useCallback(
    async (completed: boolean, duration: number, startedAt: Date | null) => {
      if (duration <= 0) return;
      await createSession.mutateAsync({
        todoId: selectedTodoId || null,
        duration,
        completed,
        startedAt: (startedAt || new Date()).toISOString(),
        endedAt: new Date().toISOString(),
      });
    },
    [createSession, selectedTodoId],
  );

  const handleFocusInputChange = (valStr: string) => {
    setFocusInput(valStr);
    const clean = valStr.replace(/[^0-9]/g, "");
    const num = Number(clean);
    if (clean && num >= 1 && num <= 180) {
      setFocusMin(num);
    }
  };

  const handleFocusInputBlur = () => {
    const num = Number(focusInput.replace(/[^0-9]/g, ""));
    if (!num || num < 1) {
      setFocusMin(1);
      setFocusInput("1");
    } else if (num > 180) {
      setFocusMin(180);
      setFocusInput("180");
    } else {
      setFocusInput(num.toString());
    }
  };

  const handleBreakInputChange = (valStr: string) => {
    setBreakInput(valStr);
    const clean = valStr.replace(/[^0-9]/g, "");
    const num = Number(clean);
    if (clean && num >= 0 && num <= 60) {
      setBreakMin(num);
    }
  };

  const handleBreakInputBlur = () => {
    const num = Number(breakInput.replace(/[^0-9]/g, ""));
    if (isNaN(num) || num < 0) {
      setBreakMin(0);
      setBreakInput("0");
    } else if (num > 60) {
      setBreakMin(60);
      setBreakInput("60");
    } else {
      setBreakInput(num.toString());
    }
  };

  useEffect(() => {
    setFocusInput(focusMin.toString());
  }, [focusMin]);

  useEffect(() => {
    setBreakInput(breakMin.toString());
  }, [breakMin]);

  useEffect(() => {
    return () => setFocusMode(false);
  }, [setFocusMode]);

  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(mode === "focus" ? focusSeconds : breakSeconds);
    }
  }, [focusMin, breakMin, mode, isRunning, focusSeconds, breakSeconds]);

  // Tab Title Timer Sync
  useEffect(() => {
    if (isRunning) {
      document.title = `(${formatTimer(secondsLeft)}) ${mode === "focus" ? "Focus" : "Break"} | Taskify`;
    } else {
      document.title = "Focus | Taskify";
    }
    return () => {
      document.title = "Taskify";
    };
  }, [isRunning, secondsLeft, mode]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;

        if (mode === "focus") {
          void recordFocusSession(true, focusSeconds, focusStartedAt.current);
          focusStartedAt.current = null;
          playChimeSound();
          notify("Focus Session Complete! 🎉", "Time for a short break.");
          toast.success("Focus Session Complete! 🎉", {
            description: "Well done! Take a short break now.",
            duration: 8000
          });
          if (breakMin === 0) {
            // Skip break mode
            focusStartedAt.current = new Date();
            return focusSeconds;
          }
          setMode("break");
          return breakSeconds;
        }

        playChimeSound();
        notify("Break Complete! ⚡", "Ready for another focus session.");
        toast.info("Break Complete! ⚡", {
          description: "Time to get back to work! Start your next focus session.",
          duration: 8000
        });
        setMode("focus");
        focusStartedAt.current = new Date();
        return focusSeconds;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, mode, recordFocusSession, focusSeconds, breakSeconds, breakMin]);

  const start = async () => {
    await requestNotifications();
    if (mode === "focus" && !focusStartedAt.current) {
      focusStartedAt.current = new Date();
    }
    setIsRunning(true);
  };

  const reset = async () => {
    if (mode === "focus" && focusStartedAt.current && secondsLeft < focusSeconds) {
      await recordFocusSession(false, focusSeconds - secondsLeft, focusStartedAt.current);
    }
    focusStartedAt.current = null;
    setIsRunning(false);
    setMode("focus");
    setSecondsLeft(focusSeconds);
  };

  const switchTask = (value: string) => {
    if (!isRunning) setSelectedTodoId(value);
  };

  return (
    <div className={cn("mx-auto w-full space-y-6", focusMode ? "flex min-h-[calc(100vh-3rem)] max-w-5xl flex-col justify-center" : "max-w-5xl")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between animate-slide-up-fade">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
            <Timer className="h-5.5 w-5.5 text-[#5D3EBB]" />
            Focus Dashboard
            <span className="text-[#5D3EBB] text-xl font-bold">.</span>
          </h1>
          <p className="mt-1 text-[10px] text-muted-foreground/60">Pomodoro sessions, task focus, and streak history</p>
        </div>
        <Button
          onClick={() => setFocusMode(!focusMode)}
          variant={focusMode ? "secondary" : "outline"}
          className="h-9 rounded-xl px-4 text-xs"
        >
          {focusMode ? <X className="mr-1.5 h-4 w-4" /> : <Circle className="mr-1.5 h-4 w-4" />}
          {focusMode ? "Exit Focus Mode" : "Focus Mode"}
        </Button>
      </div>

      <div className={cn("grid gap-5", focusMode ? "lg:grid-cols-1" : "lg:grid-cols-[1.1fr_0.9fr]")}>
        <GlassCard className="border border-border/40 p-5 shadow-sm animate-slide-up-fade animation-delay-100">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/55">Current mode</p>
              <h2 className="text-lg font-black text-foreground">{mode === "focus" ? "Focus" : "Break"}</h2>
            </div>
            <div className="min-w-0 rounded-2xl border border-border/35 bg-secondary/25 px-4 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Active task</p>
              <p className="max-w-[260px] truncate text-xs font-semibold text-foreground/80">
                {activeTodo?.title || "No task selected"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative h-72 w-72 max-w-full">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r="118" fill="none" stroke="hsl(var(--secondary))" strokeWidth="14" />
                <circle
                  cx="128"
                  cy="128"
                  r="118"
                  fill="none"
                  stroke={mode === "focus" ? "hsl(var(--primary))" : "#10b981"}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-200 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black tabular-nums tracking-tight text-foreground">{formatTimer(secondsLeft)}</span>
                <span className="mt-2 rounded-full bg-secondary/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {Math.round(progress)}% complete
                </span>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto]">
              <select
                value={selectedTodoId}
                onChange={(e) => switchTask(e.target.value)}
                disabled={isRunning || todosLoading}
                className="h-10 rounded-2xl border border-border/45 bg-secondary/25 px-4 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-[#5D3EBB] disabled:opacity-50"
              >
                <option value="">Select focus task</option>
                {activeTodos.map((todo) => (
                  <option key={todo.id} value={todo.id}>{todo.title}</option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <Button onClick={start} disabled={isRunning} className="h-10 rounded-xl bg-[#5D3EBB] px-4 text-white hover:bg-[#4a2fa3]">
                  <Play className="mr-1.5 h-4 w-4" />
                  {secondsLeft === totalSeconds ? "Start" : "Resume"}
                </Button>
                <Button onClick={() => setIsRunning(false)} disabled={!isRunning} variant="secondary" className="h-10 rounded-xl px-4">
                  <Pause className="mr-1.5 h-4 w-4" />
                  Pause
                </Button>
                <Button onClick={reset} variant="ghost" className="h-10 rounded-xl px-3">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Custom Timer Durations */}
            <div className="flex flex-wrap items-center gap-6 justify-between w-full border-t border-border/10 pt-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Focus Duration:</span>
                <div className="flex items-center gap-1 bg-secondary/25 rounded-xl p-0.5 border border-border/30">
                  <button
                    type="button"
                    onClick={() => setFocusMin(prev => Math.max(1, prev - 1))}
                    disabled={isRunning || focusMin <= 1}
                    className="h-7 w-7 rounded-lg hover:bg-secondary/40 text-foreground font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={focusInput}
                    onChange={(e) => handleFocusInputChange(e.target.value)}
                    onBlur={handleFocusInputBlur}
                    disabled={isRunning}
                    className="w-9 bg-transparent text-center text-xs font-bold text-foreground outline-none border-none focus:ring-0 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setFocusMin(prev => Math.min(180, prev + 1))}
                    disabled={isRunning || focusMin >= 180}
                    className="h-7 w-7 rounded-lg hover:bg-secondary/40 text-foreground font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground/60">min</span>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Break Duration:</span>
                <div className="flex items-center gap-1 bg-secondary/25 rounded-xl p-0.5 border border-border/30">
                  <button
                    type="button"
                    onClick={() => setBreakMin(prev => Math.max(0, prev - 1))}
                    disabled={isRunning || breakMin <= 0}
                    className="h-7 w-7 rounded-lg hover:bg-secondary/40 text-foreground font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={breakInput}
                    onChange={(e) => handleBreakInputChange(e.target.value)}
                    onBlur={handleBreakInputBlur}
                    disabled={isRunning}
                    className="w-9 bg-transparent text-center text-xs font-bold text-foreground outline-none border-none focus:ring-0 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => setBreakMin(prev => Math.min(60, prev + 1))}
                    disabled={isRunning || breakMin >= 60}
                    className="h-7 w-7 rounded-lg hover:bg-secondary/40 text-foreground font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
                  >
                    +
                  </button>
                </div>
                <span className="text-[11px] font-medium text-muted-foreground/60">min</span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1 bg-secondary/10 p-0.5 rounded-xl border border-border/20">
                {[15, 25, 45, 60].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setFocusMin(preset);
                      const autoBreak = preset === 15 ? 3 : preset === 25 ? 5 : preset === 45 ? 10 : 15;
                      setBreakMin(autoBreak);
                    }}
                    disabled={isRunning}
                    className={cn(
                      "h-7 px-2.5 rounded-lg text-[10px] font-bold transition-all",
                      focusMin === preset
                        ? "bg-[#5D3EBB] text-white shadow-sm"
                        : "text-muted-foreground/60 hover:text-foreground/80"
                    )}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {!focusMode && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 animate-slide-up-fade animation-delay-100">
              {statsLoading ? (
                [1, 2, 3, 4].map((item) => <div key={item} className="h-24 rounded-2xl shimmer" />)
              ) : (
                <>
                  <Metric icon={Flame} label="Current Streak" value={`${stats?.currentStreak || 0} Days`} tone="text-amber-500" />
                  <Metric icon={Trophy} label="Longest Streak" value={`${stats?.longestStreak || 0} Days`} tone="text-yellow-500" />
                  <Metric icon={ListChecks} label="Sessions" value={`${stats?.totalFocusSessions || 0}`} tone="text-[#5D3EBB]" />
                  <Metric icon={Clock3} label="Focus Time" value={formatDuration(stats?.totalFocusTime || 0)} tone="text-emerald-500" />
                </>
              )}
            </div>

            <GlassCard className="border border-border/40 p-4 shadow-sm animate-slide-up-fade animation-delay-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <History className="h-4.5 w-4.5 text-[#5D3EBB]" />
                  Recent Sessions
                </h2>
              </div>

              {historyLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-12 rounded-xl shimmer" />)}</div>
              ) : historyError ? (
                <p className="rounded-xl border border-destructive/15 bg-destructive/10 px-3 py-3 text-xs font-medium text-destructive">
                  Could not load focus history.
                </p>
              ) : !history?.length ? (
                <p className="rounded-xl border border-dashed border-border/40 bg-secondary/15 px-3 py-8 text-center text-xs text-muted-foreground/50">
                  No focus sessions yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((session) => (
                    <div key={session.id} className="flex items-center gap-3 rounded-xl bg-secondary/15 px-3 py-2.5">
                      {session.completed ? (
                        <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 shrink-0 text-muted-foreground/40" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-foreground/80">{session.todo?.title || "Untitled focus session"}</p>
                        <p className="text-[10px] text-muted-foreground/50">
                          {formatDuration(session.duration)} · {new Date(session.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={cn("rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider", session.completed ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500")}>
                        {session.completed ? "Completed" : "Interrupted"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <GlassCard className="border border-border/40 p-4 shadow-sm">
      <div className={cn("mb-2 flex items-center gap-2", tone)}>
        <Icon className="h-4 w-4" />
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-black tabular-nums text-foreground">{value}</p>
    </GlassCard>
  );
}
