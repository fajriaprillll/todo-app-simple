import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { useDocumentTitle } from "@/lib/use-document-title";
import type { AuthResponse } from "@/types";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";

export function LoginPage() {
  useDocumentTitle("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>("/auth/login", { email, password });
      login(res.user, res.accessToken, res.refreshToken);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen mesh-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[400px] w-[400px] bg-gradient-to-l from-purple-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute -left-40 top-1/3 h-[300px] w-[300px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-col justify-center px-6">
        <div className="text-center mb-10 animate-slide-up-fade">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-purple-500 shadow-xl shadow-primary/30 ring-1 ring-primary/20">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">
            Welcome back
            <span className="ml-1 text-gradient">.</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground/60">Sign in to your workspace</p>
        </div>

        <form onSubmit={submit} className="space-y-5 animate-slide-up-fade animation-delay-100">
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive animate-shake">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {error}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Email</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="relative h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl px-3.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Password</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="relative h-11 w-full rounded-xl border border-border/50 bg-background/60 backdrop-blur-xl px-3.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-200 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Signing in...
              </span>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <p className="pt-4 text-center text-sm text-muted-foreground/60">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary font-semibold transition-colors hover:text-primary/80">
              Create one
            </Link>
          </p>
        </form>

        <p className="mt-12 text-center text-xs text-muted-foreground/20">
          &copy; 2026 Todo App
        </p>
      </div>
    </div>
  );
}
