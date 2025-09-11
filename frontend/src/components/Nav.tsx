"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function Nav() {
  const router = useRouter();
  const { user, logout, refresh } = useSession();
  const qc = useQueryClient();
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
      {!user && <Link className="underline" href="/">Home</Link>}
      <Link className="underline" href="/dashboard">Dashboard</Link>
      <Link className="underline" href="/subscriptions">Subscriptions</Link>
      <Link className="underline" href="/expenses">Expenses</Link>
      <Link className="underline" href="/notifications">Notifications{unread ? ` (${unread})` : ""}</Link>
      {user && (
        <div className="ml-auto flex items-center gap-3">
          <button
            className="text-sm underline"
            onClick={async () => {
              try {
                await logout();
              } finally {
                // Navigate to Home and refresh to clear any stale UI
                router.replace("/");
                router.refresh();
              }
            }}
          >Logout</button>
          <button
            className="text-sm text-red-600 underline"
            onClick={async () => {
              if (!confirm("Delete your account and all data? This cannot be undone.")) return;
              try {
                const res = await fetch(`${API}/api/v1/auth/account`, { method: "DELETE", credentials: "include" });
                if (!res.ok) throw new Error(await res.text());
              } catch (_) {}
              // Proactively clear session and logout to remove cookies, then hard navigate to Home
              try { await logout(); } catch {}
              qc.setQueryData(["me"], null);
              await refresh();
              window.location.replace("/");
            }}
          >Delete account</button>
        </div>
      )}
    </nav>
  );
}
