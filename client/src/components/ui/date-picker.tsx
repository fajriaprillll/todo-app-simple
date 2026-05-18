import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + "T00:00:00");
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const selectedDate = value ? new Date(value + "T00:00:00") : null;

  function isToday(d: number) {
    const date = new Date(year, month, d);
    return date.getTime() === today.getTime();
  }

  function isSelected(d: number) {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === d &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  }

  function isPast(d: number) {
    const date = new Date(year, month, d);
    return date < today && !isToday(d);
  }

  function formatDisplay(dateStr: string) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-xl border bg-background/50 backdrop-blur-xl px-3.5 text-sm transition-all duration-200",
          "hover:border-muted-foreground/30",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring",
          value ? "text-foreground border-border" : "text-muted-foreground/50 border-border"
        )}
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        <span className="flex-1 text-left truncate">
          {value ? formatDisplay(value) : "Pick a date"}
        </span>
        {value && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/30 transition-colors hover:text-foreground hover:bg-secondary"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div className="relative">
          <div className="absolute top-1 z-50 w-full animate-scale-in rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl p-3 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground/70"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-medium text-foreground/70">
                {months[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-secondary hover:text-foreground/70"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {dayLabels.map((d) => (
                <div key={d} className="flex h-7 items-center justify-center text-[10px] font-medium text-muted-foreground/30 uppercase tracking-wider">
                  {d}
                </div>
              ))}
              {days.map((d, i) =>
                d ? (
                  <button
                    key={i}
                    type="button"
                    disabled={isPast(d)}
                    onClick={() => {
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                      onChange(dateStr);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex h-8 w-full items-center justify-center rounded-lg text-xs transition-all duration-100",
                      "disabled:opacity-15 disabled:cursor-not-allowed",
                      isSelected(d)
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : isToday(d)
                          ? "text-primary font-semibold hover:bg-primary/15"
                          : "text-foreground/60 hover:bg-secondary hover:text-foreground/90"
                    )}
                  >
                    {d}
                  </button>
                ) : (
                  <div key={i} />
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
