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
