import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/app-store";
import { useTodos } from "@/lib/queries";
import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const { data: todos } = useTodos();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const next = !commandPaletteOpen;
        setCommandPaletteOpen(next);
        if (next) setQuery("");
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelected(0);
    }
  }, [commandPaletteOpen]);

  const filtered = (todos || []).filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    }
    if (e.key === "Enter" && filtered[selected]) {
      setCommandPaletteOpen(false);
      navigate("/todos");
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12%]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => setCommandPaletteOpen(false)}
      />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKey}
            placeholder="Search todos..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
          />
          <kbd className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground/50">
            esc
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {query && filtered.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Command className="h-4 w-4" />
              No results found
            </div>
          )}
          {query
            ? filtered.slice(0, 8).map((todo, i) => (
                <button
                  key={todo.id}
                  onClick={() => {
                    setCommandPaletteOpen(false);
                    navigate("/todos");
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    i === selected
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      todo.completed
                        ? "bg-emerald-500"
                        : todo.priority === "high"
                          ? "bg-red-500"
                          : todo.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                    )}
                  />
                  <span
                    className={cn(
                      "truncate",
                      todo.completed && "text-muted-foreground/50 line-through"
                    )}
                  >
                    {todo.title}
                  </span>
                </button>
              ))
            : !query && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground/50">
                  Type to search your todos
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
