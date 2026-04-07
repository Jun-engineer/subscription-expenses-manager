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
    <div className="p-4 sm:p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {error && <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 rounded-lg p-3">{error}</p>}
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No notifications</p>}
        {items.map((n) => (
          <div key={n.id} className={`border rounded-lg p-3 dark:border-gray-800 ${n.read ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm">{n.type}</div>
                <div className="text-xs text-gray-500">{new Date(n.created_at).toLocaleString()}</div>
                {n.payload && (
                  <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded-lg mt-1 overflow-auto">{JSON.stringify(n.payload, null, 2)}</pre>
                )}
              </div>
              {!n.read && (
                <button className="text-sm rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => markRead([n.id])}>Mark read</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {items.some((i) => !i.read) && (
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition" onClick={() => markRead(items.filter(i => !i.read).map(i => i.id))}>
          Mark all read
        </button>
      )}
    </div>
  );
}
