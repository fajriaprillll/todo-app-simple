import { create } from "zustand";
import type { User } from "@/types";
import { setAccessToken } from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user, accessToken, refreshToken) => {
    setAccessToken(accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    set({ user: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
