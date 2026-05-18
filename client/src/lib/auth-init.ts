import { api, setAccessToken } from "./api";

export async function initAuth() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const res = await api.post<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      { refreshToken }
    );
    setAccessToken(res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    const user = await api.get<{
      id: string;
      name: string | null;
      email: string;
      image: null;
    }>("/auth/me");
    return { ...user, image: null };
  } catch {
    localStorage.removeItem("refreshToken");
    return null;
  }
}
