import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["⌘K", "Ctrl+K"], desc: "Open command palette" },
  { keys: ["N"], desc: "New todo" },
  { keys: ["/"], desc: "Focus search" },
  { keys: ["Esc"], desc: "Cancel / close" },
  { keys: ["?"], desc: "Toggle shortcuts" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "?") { e.preventDefault(); setOpen((p) => !p); }
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl p-6 shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Keyboard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
            <p className="text-xs text-muted-foreground/50">Press <kbd className="rounded border border-border/50 px-1 py-0.5 text-[10px]">?</kbd> to toggle</p>
          </div>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.desc} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-secondary/50 transition-colors">
              <span className="text-xs text-muted-foreground/70">{s.desc}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={i}>
                    <kbd className="rounded-md border border-border/50 bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">{k}</kbd>
                    {i < s.keys.length - 1 && <span className="text-muted-foreground/30 mx-1">or</span>}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
