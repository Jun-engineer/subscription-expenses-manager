"use client";

import { useEffect, useState } from "react";
import { API, getMe, loginWithCookie, logoutCookie } from "@/lib/auth";

type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  next_payment_date?: string | null;
};

export default function Home() {
  const [me, setMe] = useState<any | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [error, setError] = useState<string>("");

  const loadMe = async () => {
    try {
      const user = await getMe();
      setMe(user);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (!me) return;
    fetch(`${API}/api/v1/subscriptions`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => setSubs(data))
      .catch((e) => setError(String(e)));
  }, [me]);

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

  const login = async () => {
    setError("");
    try {
      await loginWithCookie(email, password);
      await loadMe();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  if (!me) {
    return (
      <div className="p-8 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Subscriptions Manager (MVP)</h1>
        <input className="border p-2 w-full" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2 w-full" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white" onClick={signup}>Sign up</button>
          <button className="px-4 py-2 bg-green-600 text-white" onClick={login}>Log in</button>
        </div>
        {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your subscriptions</h1>
        <button
          className="text-sm underline"
          onClick={async () => {
            await logoutCookie();
            setMe(null);
          }}
        >
          Logout
        </button>
      </div>
      {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}
      <ul className="space-y-2">
        {subs.map((s) => (
          <li key={s.id} className="border p-3 rounded">
            <div className="font-semibold">{s.name}</div>
            <div className="text-sm">{s.price} {s.currency} • {s.billing_cycle} {s.next_payment_date ? `• next: ${s.next_payment_date}` : ""}</div>
          </li>
        ))}
      </ul>
      {subs.length === 0 && <p>No subscriptions yet.</p>}
    </div>
  );
}
