"use client";

import { useEffect, useState } from "react";
import { API, loginWithCookie, logoutCookie } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";

type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  next_payment_date?: string | null;
};

export default function Home() {
  const { user, loading, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [error, setError] = useState<string>("");

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API}/api/v1/subscriptions`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setSubs(data))
      .catch((e) => setError(String(e)));
  }, [user]);

  const signup = async () => {
    setError("");
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
    }
  };

  const doLogin = async () => {
    setError("");
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  if (loading) {
    return <div className="p-8 max-w-md mx-auto">Loading...</div>;
  }
  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Subscriptions Manager (MVP)</h1>
        <input className="border p-2 w-full" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 w-full" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white" onClick={signup}>Sign up</button>
          <button className="px-4 py-2 bg-green-600 text-white" onClick={doLogin}>Log in</button>
        </div>
        {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}
      </div>
    );
  }
  return <div className="p-8">Redirecting...</div>;
}
