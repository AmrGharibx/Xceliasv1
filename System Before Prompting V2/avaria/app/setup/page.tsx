"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GraduationCap, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((d) => {
        if (!d.setupRequired) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Setup failed");
        setLoading(false);
        return;
      }

      router.replace("/");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0a09]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0c0a09] overflow-hidden">
      <div className="mesh-blob w-[600px] h-[600px] -top-40 -left-40" style={{ background: "rgba(99, 102, 241, 0.04)" }} />
      <div className="mesh-blob w-[500px] h-[500px] bottom-0 right-0" style={{ background: "rgba(139, 92, 246, 0.03)" }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="obsidian-card p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15">
              <GraduationCap className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Welcome to Avaria Academy</h1>
            <p className="mt-1.5 text-[13px] text-[#57534e]">Create your administrator account to get started</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-rose-500/15 bg-rose-500/5 p-3 text-center text-[13px] text-rose-400"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#57534e]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                placeholder="Amr Gharib"
                className="w-full rounded-xl border border-[rgba(100,100,160,0.08)] bg-[#171412] px-4 py-3 text-[14px] text-[#fafaf9] placeholder:text-[#44403c] outline-none transition-all focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#57534e]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@avaria.academy"
                className="w-full rounded-xl border border-[rgba(100,100,160,0.08)] bg-[#171412] px-4 py-3 text-[14px] text-[#fafaf9] placeholder:text-[#44403c] outline-none transition-all focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#57534e]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-[rgba(100,100,160,0.08)] bg-[#171412] px-4 py-3 pr-11 text-[14px] text-[#fafaf9] placeholder:text-[#44403c] outline-none transition-all focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#57534e] hover:text-[#d6d3d1] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Create Admin Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-[#44403c]">
            This setup page only appears once, on first launch
          </p>
        </div>
      </motion.div>
    </div>
  );
}
