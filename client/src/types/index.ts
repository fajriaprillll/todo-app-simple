export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  subtasks: Subtask[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  todoId: string | null;
  duration: number;
  completed: boolean;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  todo: { id: string; title: string } | null;
}

export interface FocusStats {
  currentStreak: number;
  longestStreak: number;
  totalFocusSessions: number;
  totalFocusTime: number;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TodoStats {
  total: number;
  completed: number;
  active: number;
  percentage: number;
  byPriority: Record<Priority, number>;
  streak: number;
  todayCompleted: number;
}
