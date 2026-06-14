import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { useDocumentTitle } from "@/lib/use-document-title";
import type { AuthResponse } from "@/types";
import { ArrowRight, Eye, EyeOff, Crown } from "lucide-react";

export function RegisterPage() {
  useDocumentTitle("Create account");
  const [name, setName] = useState("");
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
      const res = await api.post<AuthResponse>("/auth/register", { name, email, password });
      login(res.user, res.accessToken, res.refreshToken);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 overflow-hidden">
      
      {/* Decorative background shapes */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#5D3EBB]/5 dark:bg-[#5D3EBB]/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-amber-400/5 dark:bg-amber-400/10 blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md rounded-[2.5rem] bg-background/95 dark:bg-card/90 backdrop-blur-md p-8 md:p-10 border border-white/10 shadow-2xl flex flex-col justify-center animate-slide-up-fade">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5D3EBB] text-[#FED29C] shadow-xl shadow-[#5D3EBB]/20 ring-1 ring-white/10 animate-float">
            <Crown className="h-8 w-8 fill-current" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Create account
            <span className="text-[#5D3EBB] text-xl">.</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground/60">Get started with your Taskify productivity workspace</p>
        </div>

        <form onSubmit={submit} className="space-y-4.5">
          {error && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-xs text-rose-500 font-semibold animate-shake">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {error}
              </div>
            </div>
          )}

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Name</label>
            <div className="relative group">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="relative h-11 w-full rounded-2xl border border-border bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/45 transition-all duration-200 hover:border-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-[#5D3EBB]"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Email</label>
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@taskify.com"
                required
                autoComplete="email"
                className="relative h-11 w-full rounded-2xl border border-border bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/45 transition-all duration-200 hover:border-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-[#5D3EBB]"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Password</label>
            <div className="relative group">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
                className="relative h-11 w-full rounded-2xl border border-border bg-background/50 px-4 pr-10 text-sm text-foreground placeholder:text-muted-foreground/45 transition-all duration-200 hover:border-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-[#5D3EBB]"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors hover:text-muted-foreground/75"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#5D3EBB] hover:bg-[#4d32a3] text-xs font-bold text-white shadow-xl shadow-[#5D3EBB]/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2.5">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account...
              </span>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          <p className="pt-3.5 text-center text-xs text-muted-foreground/60">
            Already have an account?{" "}
            <Link to="/login" className="text-[#5D3EBB] dark:text-[#FED29C] font-bold transition-colors hover:opacity-80">
              Sign In
            </Link>
          </p>
        </form>

        <p className="mt-8 text-center text-[10px] text-muted-foreground/30 font-medium">
          &copy; 2026 Taskify productivity workspace. All rights reserved.
        </p>
      </div>
    </div>
  );
}
