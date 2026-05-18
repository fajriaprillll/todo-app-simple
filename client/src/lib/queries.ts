import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { Todo, TodoStats } from "@/types";

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
