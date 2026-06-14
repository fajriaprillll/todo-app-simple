import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { FocusSession, FocusStats, Subtask, Todo, TodoStats } from "@/types";

export function useTodos() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: () => api.get<Todo[]>("/todos"),
  });
}

export function useTodoStats() {
  return useQuery({
    queryKey: ["todos", "stats"],
    queryFn: () => api.get<TodoStats>("/todos/stats"),
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; priority?: string; dueDate?: string }) =>
      api.post<Todo>("/todos", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["todos", "stats"] });
    },
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Todo> & { id: string }) =>
      api.patch<Todo>(`/todos/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["todos", "stats"] });
    },
  });
}

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api.post<Subtask>(`/todos/${taskId}/subtasks`, { title }),
    onMutate: async ({ taskId, title }) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const previous = qc.getQueryData<Todo[]>(["todos"]);
      const optimistic: Subtask = {
        id: `temp-${Date.now()}`,
        taskId,
        title,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<Todo[]>(["todos"], (current) =>
        current?.map((todo) =>
          todo.id === taskId ? { ...todo, subtasks: [...todo.subtasks, optimistic] } : todo,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(["todos"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useUpdateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Pick<Subtask, "title" | "completed">> & { id: string }) =>
      api.patch<Subtask>(`/todos/subtasks/${id}`, data),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const previous = qc.getQueryData<Todo[]>(["todos"]);
      qc.setQueryData<Todo[]>(["todos"], (current) =>
        current?.map((todo) => ({
          ...todo,
          subtasks: todo.subtasks.map((subtask) =>
            subtask.id === id
              ? { ...subtask, ...data, updatedAt: new Date().toISOString() }
              : subtask,
          ),
        })),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(["todos"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useDeleteSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/todos/subtasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["todos"] });
      const previous = qc.getQueryData<Todo[]>(["todos"]);
      qc.setQueryData<Todo[]>(["todos"], (current) =>
        current?.map((todo) => ({
          ...todo,
          subtasks: todo.subtasks.filter((subtask) => subtask.id !== id),
        })),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) qc.setQueryData(["todos"], context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/todos/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
      qc.invalidateQueries({ queryKey: ["todos", "stats"] });
    },
  });
}

export function useReorderTodos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.put("/todos/reorder", { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useCreateFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      todoId?: string | null;
      duration: number;
      completed: boolean;
      startedAt?: string;
      endedAt?: string;
    }) => api.post<FocusSession>("/pomodoro/session", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pomodoro", "history"] });
      qc.invalidateQueries({ queryKey: ["pomodoro", "stats"] });
    },
  });
}

export function useFocusHistory() {
  return useQuery({
    queryKey: ["pomodoro", "history"],
    queryFn: () => api.get<FocusSession[]>("/pomodoro/history"),
  });
}

export function useFocusStats() {
  return useQuery({
    queryKey: ["pomodoro", "stats"],
    queryFn: () => api.get<FocusStats>("/pomodoro/stats"),
  });
}
