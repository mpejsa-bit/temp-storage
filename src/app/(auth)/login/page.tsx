"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isAdminName = name.trim().toLowerCase() === "admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (isAdminName && !password) {
      setError("Password is required for admin login.");
      return;
    }
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      name: name.trim(),
      password: isAdminName ? password : "",
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError(isAdminName ? "Invalid admin password." : "Something went wrong. Please try again.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400 tracking-wider uppercase mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Solution Scoping Document
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">Welcome</h1>
          <p className="text-[var(--text-secondary)]">Enter your name to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="e.g. Mark Pejsa"
            />
          </div>

          {isAdminName && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Admin Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Enter admin password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition"
          >
            {loading ? "Getting started..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
