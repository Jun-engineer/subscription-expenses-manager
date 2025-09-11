"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API, logoutCookie } from "@/lib/auth";

export default function Nav() {
  const [unread, setUnread] = useState<number>(0);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/v1/notifications`, { credentials: "include" });
        if (!res.ok) return;
        const items = await res.json();
        setUnread(items.filter((i: any) => !i.read).length);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav className="p-4 border-b flex gap-4 items-center">
      <Link className="underline" href="/">Home</Link>
      <Link className="underline" href="/dashboard">Dashboard</Link>
      <Link className="underline" href="/subscriptions">Subscriptions</Link>
      <Link className="underline" href="/expenses">Expenses</Link>
      <Link className="underline" href="/notifications">Notifications{unread ? ` (${unread})` : ""}</Link>
      <button className="ml-auto text-sm underline" onClick={async () => { await logoutCookie(); location.reload(); }}>Logout</button>
    </nav>
  );
}
