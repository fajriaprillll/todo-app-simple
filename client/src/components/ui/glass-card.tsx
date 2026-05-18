import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group/card relative rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl p-5 shadow-lg shadow-black/5 transition-all duration-300",
        "hover:border-border/60 hover:shadow-xl hover:shadow-black/10 hover:bg-card/80",
        "before:pointer-events-none before:absolute before:-inset-px before:rounded-[calc(1rem+1px)] before:opacity-0 before:transition-opacity before:duration-300",
        "hover:before:opacity-100",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
