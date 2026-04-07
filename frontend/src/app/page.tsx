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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Subscription &amp; Expense Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Track your spending, manage passwords</p>
        </div>

        <div className="space-y-3">
          <input
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
          />
          <input
            className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doLogin()}
          />
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            onClick={signup}
            disabled={busy}
          >
            Sign up
          </button>
          <button
            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
            onClick={doLogin}
            disabled={busy}
          >
            Log in
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 rounded-lg p-3 whitespace-pre-wrap">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
