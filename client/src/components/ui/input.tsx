import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
        <input
          ref={ref}
          id={id}
          className={cn(
            "relative h-11 w-full rounded-xl border border-border bg-background/50 backdrop-blur-xl px-3.5 text-sm text-foreground transition-all duration-200",
            "placeholder:text-muted-foreground/50",
            "hover:border-muted-foreground/30",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive/50 focus-visible:ring-destructive/50",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-destructive" />{error}</p>}
    </div>
  ),
);

Input.displayName = "Input";
