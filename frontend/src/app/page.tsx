"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { API } from "@/lib/auth";

export default function Home() {
  const { user, loading, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const signup = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Signup success. Now login.");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const doLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent" style={{ borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" style={{ color: "var(--muted)" }}>
        Redirecting...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2" style={{ background: "var(--accent-light)" }}>
            <svg className="w-7 h-7" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SubManager</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Track subscriptions, expenses &amp; passwords</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Email</label>
              <input
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--card-border)"}
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Password</label>
              <input
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{ background: "var(--background)", border: "1px solid var(--card-border)" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--card-border)"}
                placeholder="Min 8 characters"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ border: "1px solid var(--accent)", color: "var(--accent)", background: "transparent" }}
              onClick={signup}
              disabled={busy}
            >
              Sign up
            </button>
            <button
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "var(--accent)" }}
              onClick={doLogin}
              disabled={busy}
            >
              Log in
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm rounded-xl p-3 whitespace-pre-wrap" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
