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
import {
  useTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useReorderTodos,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
} from "@/lib/queries";
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
  Plus, CheckCircle2, Circle, Trash2, Calendar, Search, X, ArrowUpDown, ListTodo,
  GripVertical, CheckSquare, Square, Download, Edit3, Check, Loader2,
} from "lucide-react";
import type { Subtask, Todo } from "@/types";

type Filter = "all" | "active" | "completed";
type Sort = "newest" | "oldest" | "priority-high" | "priority-low" | "due-date";

function SortableTodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  subtaskLoading,
  selected,
  onSelect,
  selectMode,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onCreateSubtask: (title: string) => Promise<void>;
  onUpdateSubtask: (id: string, data: Partial<Pick<Subtask, "title" | "completed">>) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  subtaskLoading: boolean;
  selected: boolean;
  onSelect: () => void;
  selectMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [subtaskError, setSubtaskError] = useState("");
  const totalSubtasks = todo.subtasks.length;
  const completedSubtasks = todo.subtasks.filter((subtask) => subtask.completed).length;
  const progress = totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const createSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title) return;
    setSubtaskError("");
    try {
      setNewSubtaskTitle("");
      await onCreateSubtask(title);
    } catch (error) {
      setSubtaskError(error instanceof Error ? error.message : "Could not create subtask");
      setNewSubtaskTitle(title);
    }
  };

  const saveSubtask = async (id: string) => {
    const title = editingSubtaskTitle.trim();
    if (!title) return;
    setSubtaskError("");
    try {
      setEditingSubtaskId(null);
      setEditingSubtaskTitle("");
      await onUpdateSubtask(id, { title });
    } catch (error) {
      setSubtaskError(error instanceof Error ? error.message : "Could not update subtask");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-2xl px-5 py-4 transition-[background,border,box-shadow,transform] duration-200 mx-1 mb-2.5 bg-secondary/10 dark:bg-secondary/5 border border-border/10 border-l-[4px]",
        todo.priority === "high" 
          ? "border-l-rose-500/60 dark:border-l-rose-500" 
          : todo.priority === "medium" 
            ? "border-l-amber-500/60 dark:border-l-amber-500" 
            : "border-l-indigo-500/60 dark:border-l-indigo-500",
        isDragging ? "z-10 shadow-xl shadow-[#5D3EBB]/10 scale-[1.02] bg-card border-[#5D3EBB]/30" : "hover:bg-secondary/40",
        selected && "bg-[#5D3EBB]/5 border-[#5D3EBB]/20"
      )}
    >
      <div className="flex items-center gap-4">
        {selectMode ? (
          <button onClick={onSelect} className="shrink-0 text-muted-foreground/40 hover:text-[#5D3EBB] transition-colors">
            {selected ? <CheckSquare className="h-5 w-5 text-[#5D3EBB]" /> : <Square className="h-5 w-5" />}
          </button>
        ) : (
          <button 
            className="cursor-grab active:cursor-grabbing touch-none shrink-0 text-muted-foreground/15 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#5D3EBB]" 
            {...attributes} 
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <button onClick={onToggle} className="shrink-0 text-muted-foreground/30 transition-all hover:text-[#5D3EBB] active:scale-75">
          {todo.completed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-check-pop" />
          ) : (
            <Circle className="h-5 w-5 group-hover:scale-110 transition-transform" />
          )}
        </button>

        <div className="flex-1 min-w-0" onDoubleClick={onEdit}>
          <span className={cn("text-xs font-semibold transition-all text-foreground/80 cursor-default", todo.completed && "text-muted-foreground/40 line-through")}>
            {todo.title}
          </span>
          {todo.description && (
            <p className="truncate text-[10px] text-muted-foreground/50 mt-0.5">{todo.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Badge priority={todo.priority} />
          
          {todo.dueDate && (
            <span className={cn(
              "hidden sm:flex items-center gap-1 text-[10px] font-medium",
              new Date(todo.dueDate) < new Date() && !todo.completed
                ? "text-red-400/80"
                : "text-muted-foreground/50"
            )}>
              <Calendar className="h-3.5 w-3.5" />
              {formatRelativeDate(todo.dueDate)}
            </span>
          )}

          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1 rounded-lg text-muted-foreground/30 hover:text-[#5D3EBB] hover:bg-secondary/60 transition-all active:scale-95">
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="p-1 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 pl-0 sm:pl-12">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/55">
              <span>Progress</span>
              <span className="text-foreground/70 tabular-nums">{progress}%</span>
              <span className="text-muted-foreground/40">{completedSubtasks}/{totalSubtasks} done</span>
              {subtaskLoading && <Loader2 className="h-3 w-3 animate-spin text-[#5D3EBB]" />}
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary/70">
              <div
                className="h-full rounded-full bg-[#5D3EBB] transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {todo.subtasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/35 bg-background/25 px-3 py-2 text-[10px] text-muted-foreground/45">
              No subtasks yet.
            </p>
          ) : (
            todo.subtasks.map((subtask) => (
              <div key={subtask.id} className="flex items-center gap-2 rounded-xl bg-background/25 px-2.5 py-2 text-xs">
                <button
                  onClick={() => onUpdateSubtask(subtask.id, { completed: !subtask.completed })}
                  className="shrink-0 text-muted-foreground/40 hover:text-emerald-500 active:scale-90"
                >
                  {subtask.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
                </button>
                {editingSubtaskId === subtask.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveSubtask(subtask.id);
                    }}
                  >
                    <input
                      value={editingSubtaskTitle}
                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                      className="h-7 min-w-0 flex-1 rounded-lg border border-border/45 bg-background/70 px-2 text-xs outline-none focus:ring-1 focus:ring-[#5D3EBB]"
                      autoFocus
                    />
                    <button type="submit" className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-500/10 active:scale-95">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingSubtaskId(null)} className="rounded-lg p-1 text-muted-foreground/45 hover:bg-secondary/50 active:scale-95">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      onDoubleClick={() => {
                        setEditingSubtaskId(subtask.id);
                        setEditingSubtaskTitle(subtask.title);
                      }}
                      className={cn(
                        "min-w-0 flex-1 truncate text-left text-[11px] font-medium",
                        subtask.completed ? "text-muted-foreground/40 line-through" : "text-foreground/75",
                      )}
                    >
                      {subtask.title}
                    </button>
                    <button
                      onClick={() => {
                        setEditingSubtaskId(subtask.id);
                        setEditingSubtaskTitle(subtask.title);
                      }}
                      className="rounded-lg p-1 text-muted-foreground/25 hover:bg-secondary/50 hover:text-[#5D3EBB] active:scale-95"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onDeleteSubtask(subtask.id)} className="rounded-lg p-1 text-muted-foreground/25 hover:bg-destructive/10 hover:text-destructive active:scale-95">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={createSubtask} className="mt-3 flex items-center gap-2">
          <input
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Create new subtask..."
            className="h-8.5 min-w-0 flex-1 rounded-xl border border-border/40 bg-background/40 px-3.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/35 focus:ring-1 focus:ring-[#5D3EBB] transition-all"
          />
          <button
            type="submit"
            disabled={!newSubtaskTitle.trim() || subtaskLoading}
            className="flex h-8.5 px-3.5 items-center justify-center gap-1.5 rounded-xl bg-[#5D3EBB] hover:bg-[#4a2fa3] text-white text-[11px] font-bold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Subtask
          </button>
        </form>
        {subtaskError && <p className="mt-2 text-[10px] font-medium text-destructive">{subtaskError}</p>}
      </div>
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
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Optional details..." 
          rows={2}
          className="flex w-full rounded-2xl border border-border bg-background/50 backdrop-blur-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 hover:border-muted-foreground/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5D3EBB]" 
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
        <DatePicker label="Due date" value={dueDate} onChange={setDueDate} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1 bg-[#5D3EBB] hover:bg-[#4a2fa3] text-white" disabled={loading || !title.trim()}>
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
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Optional details..." 
          rows={3}
          className="flex w-full rounded-2xl border border-border bg-background/50 backdrop-blur-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 hover:border-muted-foreground/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5D3EBB]" 
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
        <DatePicker label="Due date" value={dueDate} onChange={setDueDate} />
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1 bg-[#5D3EBB] hover:bg-[#4a2fa3] text-white" disabled={loading || !title.trim()}>
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
  useDocumentTitle("Tasks");
  const { data: todos, isLoading, isError, error } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const reorderTodos = useReorderTodos();
  const createSubtask = useCreateSubtask();
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const [newTodo, setNewTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<{ id: string; title: string; description: string | null; priority: string; dueDate: string | null } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [exportOpen]);

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
          toast.success(willComplete ? "Task completed!" : "Task reopened");
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
    await updateTodo.mutateAsync({ id: editingTodo.id, ...data, priority: data.priority as any });
    toast.success("Todo updated successfully");
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
      
      {/* Header */}
      <div className="flex items-start justify-between animate-slide-up-fade">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ListTodo className="h-5.5 w-5.5 text-[#5D3EBB]" />
            Workspace Tasks
            <span className="text-[#5D3EBB] text-xl font-bold">.</span>
          </h1>
          <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-2">
            <span>{activeCount} active</span>
            <span>&bull;</span>
            <span>{completedCount} completed</span>
            <span>&bull;</span>
            <span>{todos?.length || 0} total</span>
          </p>
        </div>
        <Button 
          onClick={() => setNewTodo(true)}
          className="h-8.5 px-4 rounded-xl bg-[#5D3EBB] hover:bg-[#4c32a3] text-white flex items-center gap-1.5 shadow-md"
        >
          <Plus className="h-4 w-4" />
          Add Todo
        </Button>
      </div>

      {/* Control Bar */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-slide-up-fade animation-delay-100">
        
        {/* Left Side: Search, Filters & Sort */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Search */}
          <div className="relative w-full sm:w-60 md:w-64">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Search tasks... (type "/")'
              className="flex h-9.5 w-full rounded-2xl border border-border/60 bg-secondary/35 pl-9.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground/45 transition-all hover:border-muted-foreground/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5D3EBB]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-0.5 rounded-2xl border border-border/40 p-0.5 bg-secondary/25 shrink-0">
            {(["all", "active", "completed"] as const).map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150", 
                  filter === f 
                    ? "bg-[#5D3EBB] text-white shadow-sm" 
                    : "text-muted-foreground/60 hover:text-foreground/80"
                )}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value as Sort)}
              className="appearance-none h-9.5 rounded-2xl border border-border/55 bg-secondary/25 pl-3.5 pr-9 text-xs text-muted-foreground/70 transition-all hover:border-muted-foreground/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5D3EBB] cursor-pointer font-medium"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority-high">Priority &uarr;</option>
              <option value="priority-low">Priority &darr;</option>
              <option value="due-date">Due date</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
        </div>

        {/* Right Side: Bulk tools & export */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button 
            onClick={() => { setSelectMode(!selectMode); setSelectedIds(new Set()); }}
            className={cn(
              "rounded-2xl h-9.5 w-9.5 flex items-center justify-center text-xs font-medium border border-border/40 transition-all active:scale-95", 
              selectMode ? "bg-[#5D3EBB]/15 text-[#5D3EBB] border-[#5D3EBB]/20" : "text-muted-foreground/50 hover:bg-secondary/40 hover:text-foreground/85"
            )}
          >
            <CheckSquare className="h-4.5 w-4.5" />
          </button>

          <div className="relative" ref={exportRef}>
            <button 
              onClick={() => setExportOpen(!exportOpen)}
              className={cn(
                "rounded-2xl h-9.5 w-9.5 flex items-center justify-center border border-border/40 text-muted-foreground/50 hover:bg-secondary/40 hover:text-foreground/85 transition-all active:scale-95",
                exportOpen && "bg-secondary/40 text-foreground/85"
              )}
            >
              <Download className="h-4.5 w-4.5" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 animate-scale-in">
                <div className="rounded-2xl border border-border/45 bg-card/95 backdrop-blur-xl py-1.5 shadow-2xl shadow-black/10 min-w-[130px] overflow-hidden">
                  <button onClick={() => { handleExportJSON(); setExportOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground/70 transition-all hover:bg-[#5D3EBB]/10 hover:text-[#5D3EBB]">Export JSON</button>
                  <button onClick={() => { handleExportCSV(); setExportOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground/70 transition-all hover:bg-[#5D3EBB]/10 hover:text-[#5D3EBB]">Export CSV</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk actions tools active state */}
      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-1.5 py-1.5 bg-[#5D3EBB]/5 border border-[#5D3EBB]/10 rounded-2xl animate-slide-up-fade">
          <span className="text-xs font-bold text-[#5D3EBB] px-2">{selectedIds.size} selected</span>
          <Button size="sm" variant="secondary" onClick={handleBulkComplete} className="h-8 rounded-xl text-xs font-semibold">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Complete all
          </Button>
          <Button size="sm" variant="danger" onClick={handleBulkDelete} className="h-8 rounded-xl text-xs font-semibold">
            <Trash2 className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Delete all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setSelectedIds(new Set()); setSelectMode(false); }} className="h-8 text-xs">
            Cancel
          </Button>
        </div>
      )}

      {/* Todo List Card Container */}
      <GlassCard className="overflow-hidden animate-slide-up-fade animation-delay-200 p-0 border border-border/40 shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-2.5">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-2xl shimmer" />)}</div>
        ) : isError ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <X className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-foreground/80">Could not load tasks</p>
            <p className="mt-1 text-xs text-muted-foreground/50">{error instanceof Error ? error.message : "Please try again."}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#5D3EBB]/10 shadow-sm">
              {search ? <Search className="h-7 w-7 text-[#5D3EBB]/50" /> : <ListTodo className="h-7 w-7 text-[#5D3EBB]/50" />}
            </div>
            <p className="text-sm font-bold text-foreground/80">
              {search ? "No results found" : filter === "completed" ? "No completed tasks" : "Your todo list is empty"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/40 mb-6">
              {search ? "Try checking spelling or filter options" : filter === "completed" ? "Complete tasks in your home workspace" : "Create a new todo task to get started"}
            </p>
            {!search && filter !== "completed" && (
              <Button size="sm" onClick={() => setNewTodo(true)} className="bg-[#5D3EBB] hover:bg-[#4a2fa3] text-white rounded-xl h-9.5 px-4 shadow-md">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Todo
              </Button>
            )}
          </div>
        ) : (
          <>
            {filter !== "completed" && activeCount > 0 && !selectMode && (
              <div className="px-4.5 pt-3.5 flex items-center gap-2">
                <button 
                  onClick={toggleSelectAll} 
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#5D3EBB] hover:bg-[#5D3EBB]/10 rounded-xl transition-all"
                >
                  <CheckCircle2 className="h-4.5 w-4.5" />
                  Complete all {activeCount} tasks
                </button>
              </div>
            )}
            
            <div className="p-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {filtered.map((todo, i) => (
                    <div key={todo.id} style={{ animation: `slide-up-fade 0.3s ease-out ${i * 0.02}s both` }}>
                      <SortableTodoItem
                        todo={todo}
                        onToggle={() => handleToggle(todo)}
                        onDelete={() => handleDelete(todo)}
                        onEdit={() => setEditingTodo(todo)}
                        onCreateSubtask={async (title) => {
                          await createSubtask.mutateAsync({ taskId: todo.id, title });
                        }}
                        onUpdateSubtask={async (id, data) => {
                          await updateSubtask.mutateAsync({ id, ...data });
                        }}
                        onDeleteSubtask={async (id) => {
                          await deleteSubtask.mutateAsync(id);
                        }}
                        subtaskLoading={createSubtask.isPending || updateSubtask.isPending || deleteSubtask.isPending}
                        selected={selectedIds.has(todo.id)}
                        onSelect={() => toggleSelect(todo.id)}
                        selectMode={selectMode}
                      />
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            
            <div className="border-t border-border/25 px-5 py-3.5 flex items-center justify-between text-[10px] text-muted-foreground/45 font-medium bg-secondary/5">
              <span>{filtered.length} task{filtered.length !== 1 ? "s" : ""} found</span>
              <span className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-border/30 bg-secondary/40 px-1 py-0.5 text-[9px]">drag</kbd> Reorder</span>
                <span className="flex items-center gap-1.5"><kbd className="rounded border border-border/30 bg-secondary/40 px-1 py-0.5 text-[9px]">dbl</kbd> Edit</span>
              </span>
            </div>
          </>
        )}
      </GlassCard>

      {/* New task Modal */}
      <Modal open={newTodo} onClose={() => setNewTodo(false)} title="New Todo">
        <NewTodoForm onSubmit={async (data) => { await createTodo.mutateAsync(data); toast.success("Todo created"); setNewTodo(false); }} onCancel={() => setNewTodo(false)} />
      </Modal>

      {/* Edit task Modal */}
      <Modal open={!!editingTodo} onClose={() => setEditingTodo(null)} title="Edit Todo">
        {editingTodo && (
          <EditTodoForm todo={editingTodo} onSubmit={handleUpdateTodo} onCancel={() => setEditingTodo(null)} />
        )}
      </Modal>
    </div>
  );
}
