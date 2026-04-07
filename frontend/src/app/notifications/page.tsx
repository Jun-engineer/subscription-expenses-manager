"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

type Notification = {
  id: string;
  type: string;
  payload?: Record<string, any> | null;
  read: boolean;
  created_at: string;
};

function formatPayload(type: string, payload?: Record<string, any> | null): string {
  if (!payload) return "";
  if (type === "payment_due" && payload.name) {
    const amt = payload.amount;
    const cur = payload.currency || "JPY";
    try {
      const f = new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(amt);
      return `${payload.name} \u2014 ${f} due`;
    } catch {
      return `${payload.name} \u2014 ${amt} ${cur} due`;
    }
  }
  return JSON.stringify(payload, null, 2);
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}

function NotificationsContent() {
  const { user } = useSession();
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string>("");
  const { push } = useToast();

  const load = async () => {
    if (!user) return;
    setError("");
    try {
      const data = await apiJson<Notification[]>(`/api/v1/notifications`);
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => { load(); }, [user]);

  const markRead = async (ids: string[]) => {
    if (!user || ids.length === 0) return;
    try {
      await apiJson(`/api/v1/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids),
      });
      push({ type: "success", message: "Marked as read" });
      await load();
    } catch (e: any) {
      push({ type: "error", message: "Failed to mark as read" });
      setError(e.message || String(e));
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {items.some((i) => !i.read) && (
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "var(--accent)" }}
            onClick={() => markRead(items.filter(i => !i.read).map(i => i.id))}
          >Mark all read</button>
        )}
      </div>
      {error && <p className="text-sm rounded-xl p-3" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>{error}</p>}

      {items.length === 0 && (
        <div className="text-center py-12 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No notifications</p>
        </div>
      )}
      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className={`rounded-2xl p-4 shadow-sm transition-all ${n.read ? "opacity-50" : ""}`} style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--accent)" }} />}
                  <span className="font-semibold text-sm">{n.type}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{new Date(n.created_at).toLocaleString()}</div>
                {n.payload && (
                  <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{formatPayload(n.type, n.payload)}</div>
                )}
              </div>
              {!n.read && (
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 shrink-0" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={() => markRead([n.id])}>Mark read</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
