import { cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  low: "bg-gradient-to-r from-blue-500/10 to-blue-500/5 text-blue-400 border-blue-500/20",
  medium: "bg-gradient-to-r from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20",
  high: "bg-gradient-to-r from-red-500/10 to-red-500/5 text-red-400 border-red-500/20",
};

const priorityDots: Record<string, string> = {
  low: "bg-blue-400",
  medium: "bg-amber-400",
  high: "bg-red-400",
};

interface BadgeProps {
  priority: "low" | "medium" | "high";
  showDot?: boolean;
}

export function Badge({ priority, showDot = true }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 shadow-sm",
        priorityColors[priority],
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shadow-sm", priorityDots[priority])} />
      )}
      {priority}
    </span>
  );
}
