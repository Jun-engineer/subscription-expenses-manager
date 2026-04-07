"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";

export default function Nav() {
  const { user, logout } = useSession();
  const qc = useQueryClient();
  const [unread, setUnread] = useState<number>(0);
  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b px-4 py-3 flex items-center gap-1 sm:gap-2 text-sm overflow-x-auto">
      {!user && (
        <Link className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition font-medium" href="/">
          Home
        </Link>
      )}
      {user && (
        <>
          <Link className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition" href="/dashboard">
            Dashboard
          </Link>
          <Link className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition" href="/subscriptions">
            Subscriptions
          </Link>
          <Link className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition" href="/expenses">
            Expenses
          </Link>
          <Link className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition" href="/vault">
            Vault
          </Link>
          <Link className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition" href="/notifications">
            Notifications{unread ? ` (${unread})` : ""}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
            <button
              className="px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={async () => {
                try { await logout(); } finally { window.location.replace("/"); }
              }}
            >Logout</button>
            <button
              className="px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition"
              onClick={async () => {
                if (!confirm("Delete your account and all data? This cannot be undone.")) return;
                try {
                  const res = await fetch(`${API}/api/v1/auth/account`, { method: "DELETE", credentials: "include" });
                  if (!res.ok) throw new Error(await res.text());
                } catch {}
                try { await logout(); } catch {}
                qc.setQueryData(["me"], null);
                window.location.replace("/");
              }}
            >Delete account</button>
          </div>
        </>
      )}
    </nav>
  );
}
