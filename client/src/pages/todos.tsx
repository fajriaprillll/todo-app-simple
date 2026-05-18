import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo, useReorderTodos } from "@/lib/queries";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { formatRelativeDate, cn, formatDate } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/use-document-title";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import {
  Plus, CheckCircle2, Circle, Trash2, Calendar, Search, X, ArrowUpDown, ListTodo,
  GripVertical, CheckSquare, Square, Download, Edit3, Check, Loader2,
} from "lucide-react";

type Filter = "all" | "active" | "completed";
type Sort = "newest" | "oldest" | "priority-high" | "priority-low" | "due-date";

function SortableTodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  selected,
  onSelect,
  selectMode,
}: {
  todo: { id: string; title: string; description: string | null; completed: boolean; priority: "low" | "medium" | "high"; dueDate: string | null };
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  selected: boolean;
  onSelect: () => void;
  selectMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 mx-1",
        isDragging ? "z-10 shadow-xl shadow-black/20 scale-[1.02] bg-card border border-border/50" : "hover:bg-secondary/40",
        selected && "bg-primary/5"
      )}
    >
      {selectMode ? (
        <button onClick={onSelect} className="shrink-0 text-muted-foreground/40 hover:text-primary transition-colors">
          {selected ? <CheckSquare className="h-4.5 w-4.5 text-primary" /> : <Square className="h-4.5 w-4.5" />}
        </button>
      ) : (
        <button className="cursor-grab active:cursor-grabbing touch-none shrink-0 text-muted-foreground/15 opacity-0 group-hover:opacity-100 transition-opacity hover:text-muted-foreground/60" {...attributes} {...listeners}>
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      <button onClick={onToggle} className="shrink-0 text-muted-foreground/30 transition-all hover:text-primary active:scale-75">
        {todo.completed ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 animate-check-pop" />
        ) : (
          <Circle className="h-4.5 w-4.5 group-hover:scale-110 transition-transform" />
        )}
      </button>

      <div className="flex-1 min-w-0" onDoubleClick={onEdit}>
        <span className={cn("text-sm transition-all text-foreground/80 cursor-default", todo.completed && "text-muted-foreground/40 line-through")}>
          {todo.title}
        </span>
        {todo.description && (
          <p className="truncate text-xs text-muted-foreground/40 mt-0.5">{todo.description}</p>
        )}
      </div>

      <Badge priority={todo.priority} />
      {todo.dueDate && (
        <span className={cn(
          "flex items-center gap-1 text-[11px] shrink-0",
          new Date(todo.dueDate) < new Date() && !todo.completed
            ? "text-red-400/70"
            : "text-muted-foreground/50"
        )}>
          <Calendar className="h-3 w-3" />
          {formatRelativeDate(todo.dueDate)}
        </span>
      )}

      <button onClick={onEdit} className="shrink-0 text-muted-foreground/15 opacity-0 transition-all hover:text-primary group-hover:opacity-100 active:scale-75">
        <Edit3 className="h-3.5 w-3.5" />
      </button>

      <button onClick={onDelete} className="shrink-0 text-muted-foreground/15 opacity-0 transition-all hover:text-destructive group-hover:opacity-100 active:scale-75">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function NewTodoForm({ onSubmit, onCancel }: {
  onSubmit: (data: { title: string; priority: string; dueDate?: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit({ title: title.trim(), description: description.trim() || undefined, priority, dueDate: dueDate || undefined });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="todo-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus required />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." rows={2}
          className="flex w-full rounded-xl border border-border bg-background/50 backdrop-blur-xl px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
        <DatePicker label="Due date" value={dueDate} onChange={setDueDate} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={loading || !title.trim()}>
          {loading ? <span className="flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Creating...</span> : "Create Todo"}
        </Button>
      </div>
    </form>
  );
}

function EditTodoForm({ todo, onSubmit, onCancel }: {
  todo: { id: string; title: string; description: string | null; priority: string; dueDate: string | null };
  onSubmit: (data: { title: string; description?: string; priority: string; dueDate?: string | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description || "");
  const [priority, setPriority] = useState(todo.priority);
  const [dueDate, setDueDate] = useState(todo.dueDate || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || null,
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input id="edit-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus required />
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details..." rows={3}
          className="flex w-full rounded-xl border border-border bg-background/50 backdrop-blur-xl px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
        <DatePicker label="Due date" value={dueDate} onChange={setDueDate} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" disabled={loading || !title.trim()}>
          {loading ? <span className="flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> Saving...</span> : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

function fireConfetti() {
  const count = 2;
  const defaults = { spread: 60, ticks: 50, gravity: 0.5, decay: 0.94, startVelocity: 30 };
  const shoot = () => {
    confetti({ ...defaults, particleCount: 40, origin: { x: Math.random(), y: Math.random() * 0.4 } });
    confetti({ ...defaults, particleCount: 25, origin: { x: Math.random(), y: Math.random() * 0.4 } });
  };
  for (let i = 0; i < count; i++) setTimeout(shoot, i * 150);
}

export function TodosPage() {
  useDocumentTitle("Todos");
  const { data: todos, isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const reorderTodos = useReorderTodos();
  const [newTodo, setNewTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<{ id: string; title: string; description: string | null; priority: string; dueDate: string | null } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setNewTodo(true); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") { setSelectMode(false); setSelectedIds(new Set()); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = useMemo(() => {
    let list = (todos || []).filter((t) => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    }).filter((t) => (search ? t.title.toLowerCase().includes(search.toLowerCase()) : true));

    switch (sort) {
      case "newest": list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "oldest": list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case "priority-high": { const order = { high: 0, medium: 1, low: 2 }; list.sort((a, b) => order[a.priority] - order[b.priority]); break; }
      case "priority-low": { const order = { low: 0, medium: 1, high: 2 }; list.sort((a, b) => order[a.priority] - order[b.priority]); break; }
      case "due-date": list.sort((a, b) => { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); }); break;
    }
    return list;
  }, [todos, filter, search, sort]);

  const activeCount = (todos || []).filter((t) => !t.completed).length;
  const completedCount = (todos || []).filter((t) => t.completed).length;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filtered.findIndex((t) => t.id === active.id);
    const newIndex = filtered.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex);
    const ids = reordered.map((t) => t.id);
    reorderTodos.mutate(ids);
  }, [filtered, reorderTodos]);

  const handleToggle = (todo: { id: string; completed: boolean }) => {
    const willComplete = !todo.completed;
    updateTodo.mutate(
      { id: todo.id, completed: willComplete },
      {
        onSuccess: () => {
          toast.success(willComplete ? "Task completed" : "Task reopened");
          if (willComplete) fireConfetti();
        },
      }
    );
  };

  const handleDelete = (todo: { id: string; title: string; priority: string; dueDate: string | null }) => {
    deleteTodo.mutate(todo.id, {
      onSuccess: () => {
        toast("Task deleted", {
          description: `"${todo.title}" was removed`,
          action: {
            label: "Undo",
            onClick: () => {
              createTodo.mutate({ title: todo.title, priority: todo.priority, dueDate: todo.dueDate || undefined });
              toast.success("Task restored");
            },
          },
          duration: 5000,
        });
      },
    });
  };

  const handleUpdateTodo = async (data: { title: string; description?: string; priority: string; dueDate?: string | null }) => {
    if (!editingTodo) return;
    await updateTodo.mutateAsync({ id: editingTodo.id, ...data });
    toast.success("Todo updated");
    setEditingTodo(null);
  };

  const handleBulkComplete = () => {
    selectedIds.forEach((id) => updateTodo.mutate({ id, completed: true }));
    toast.success(`${selectedIds.size} tasks completed`);
    fireConfetti();
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => deleteTodo.mutate(id));
    toast(`${count} tasks deleted`);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const handleExportJSON = () => {
    if (!todos?.length) { toast.error("No tasks to export"); return; }
    const blob = new Blob([JSON.stringify(todos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `todos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Tasks exported as JSON");
  };

  const handleExportCSV = () => {
    if (!todos?.length) { toast.error("No tasks to export"); return; }
    const headers = "title,description,completed,priority,dueDate,createdAt";
    const rows = todos.map((t) =>
      `"${t.title}","${t.description || ""}","${t.completed}","${t.priority}","${t.dueDate || ""}","${t.createdAt}"`
    ).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `todos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Tasks exported as CSV");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between animate-slide-up-fade">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Todos
            <span className="ml-1 text-gradient text-2xl">.</span>
          </h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5 flex items-center gap-2">
            <span>{activeCount} active</span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span>{completedCount} completed</span>
            <span className="text-muted-foreground/20">&bull;</span>
            <span>{todos?.length || 0} total</span>
          </p>
        </div>
        <Button onClick={() => setNewTodo(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Todo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 animate-slide-up-fade animation-delay-100">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/30" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search todos... (type "/")'
            className="flex h-9 w-full rounded-xl border border-border bg-background/50 backdrop-blur-xl pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex gap-1 rounded-xl border border-border/50 p-0.5 bg-secondary/30">
          {(["all", "active", "completed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150", filter === f ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground/50 hover:text-foreground/70")}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
            className="appearance-none h-9 rounded-xl border border-border/50 bg-background/50 backdrop-blur-xl pl-3 pr-8 text-xs text-muted-foreground/70 transition-all hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer">
            <option value="newest" className="bg-background text-foreground">Newest</option>
            <option value="oldest" className="bg-background text-foreground">Oldest</option>
            <option value="priority-high" className="bg-background text-foreground">Priority &uarr;</option>
            <option value="priority-low" className="bg-background text-foreground">Priority &darr;</option>
            <option value="due-date" className="bg-background text-foreground">Due date</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30" />
        </div>

        <div className="flex gap-1">
          <button onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={cn("rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all", selectMode ? "bg-primary/15 text-primary" : "text-muted-foreground/50 hover:text-foreground/70")}>
            <CheckSquare className="h-3.5 w-3.5" />
          </button>

          <div className="relative group">
            <button className="rounded-xl px-2.5 py-1.5 text-xs text-muted-foreground/50 hover:text-foreground/70 transition-all">
              <Download className="h-3.5 w-3.5" />
            </button>
            <div className="absolute right-0 top-full mt-1 z-50 hidden group-hover:block animate-scale-in">
              <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl py-1 shadow-2xl shadow-black/20 min-w-[130px]">
                <button onClick={handleExportJSON} className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground/70 transition-all hover:bg-secondary/50 hover:text-foreground">Export JSON</button>
                <button onClick={handleExportCSV} className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground/70 transition-all hover:bg-secondary/50 hover:text-foreground">Export CSV</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-1 animate-slide-up-fade">
          <span className="text-xs text-muted-foreground/60">{selectedIds.size} selected</span>
          <Button size="sm" variant="secondary" onClick={handleBulkComplete}>
            <CheckCircle2 className="mr-1.5 h-3 w-3" /> Complete all
          </Button>
          <Button size="sm" variant="danger" onClick={handleBulkDelete}>
            <Trash2 className="mr-1.5 h-3 w-3" /> Delete all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedIds(new Set()); setSelectMode(false); }}>
            Cancel
          </Button>
        </div>
      )}

      <GlassCard className="overflow-hidden animate-slide-up-fade animation-delay-200 p-0">
        {isLoading ? (
          <div className="p-6 space-y-2">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-xl shimmer" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm">
              {search ? <Search className="h-7 w-7 text-muted-foreground/40" /> : <ListTodo className="h-7 w-7 text-muted-foreground/40" />}
            </div>
            <p className="text-sm font-semibold text-foreground/60">
              {search ? "No results found" : filter === "completed" ? "No completed tasks" : "Your todo list is empty"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/40 mb-6">
              {search ? "Try a different search term" : filter === "completed" ? "Complete some tasks to see them here" : "Create your first todo to get started"}
            </p>
            {!search && filter !== "completed" && (
              <Button size="sm" onClick={() => setNewTodo(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Create Todo
              </Button>
            )}
          </div>
        ) : (
          <>
            {filter !== "completed" && activeCount > 0 && !selectMode && (
              <div className="px-4 pt-3 flex items-center gap-2">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/50 transition-all hover:text-foreground/70 rounded-lg hover:bg-secondary/50">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Complete all {activeCount} tasks
                </button>
              </div>
            )}
            <div className="p-1">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {filtered.map((todo, i) => (
                    <div key={todo.id} style={{ animation: `slide-up-fade 0.3s ease-out ${i * 0.02}s both` }}>
                      <SortableTodoItem
                        todo={todo}
                        onToggle={() => handleToggle(todo)}
                        onDelete={() => handleDelete(todo)}
                        onEdit={() => setEditingTodo(todo)}
                        selected={selectedIds.has(todo.id)}
                        onSelect={() => toggleSelect(todo.id)}
                        selectMode={selectMode}
                      />
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <div className="border-t border-border/30 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground/30">
              <span className="font-medium">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-border/30 bg-secondary/30 px-1 py-0.5 text-[9px]">drag</kbd> Reorder</span>
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-border/30 bg-secondary/30 px-1 py-0.5 text-[9px]">dbl</kbd> Edit</span>
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-border/30 bg-secondary/30 px-1 py-0.5 text-[9px]">?</kbd> Shortcuts</span>
              </span>
            </div>
          </>
        )}
      </GlassCard>

      <Modal open={newTodo} onClose={() => setNewTodo(false)} title="New Todo">
        <NewTodoForm onSubmit={async (data) => { await createTodo.mutateAsync(data); toast.success("Todo created"); setNewTodo(false); }} onCancel={() => setNewTodo(false)} />
      </Modal>

      <Modal open={!!editingTodo} onClose={() => setEditingTodo(null)} title="Edit Todo">
        {editingTodo && (
          <EditTodoForm todo={editingTodo} onSubmit={handleUpdateTodo} onCancel={() => setEditingTodo(null)} />
        )}
      </Modal>
    </div>
  );
}
