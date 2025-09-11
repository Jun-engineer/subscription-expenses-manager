"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { getMe } from "@/lib/auth";

type Notification = {
  id: string;
  type: string;
  payload?: Record<string, any> | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [me, setMe] = useState<any | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string>("");
  const { push } = useToast();

  useEffect(() => {
    getMe().then(setMe).catch(() => setMe(null));
  }, []);

  const load = async () => {
    if (!me) return;
    setError("");
    try {
      const data = await apiJson<Notification[]>(`/api/v1/notifications`);
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => { load(); }, [me]);

  const markRead = async (ids: string[]) => {
    if (!me || ids.length === 0) return;
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

  if (me === null && items.length === 0 && !error) return <div className="p-8">Loading...</div>;
  if (!me) return <div className="p-8">Please log in first.</div>;

  return (
    <div className="p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Notifications</h1>
      {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className={`border p-3 rounded ${n.read ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{n.type}</div>
                <div className="text-xs text-gray-600">{new Date(n.created_at).toLocaleString()}</div>
                {n.payload && (
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">{JSON.stringify(n.payload, null, 2)}</pre>
                )}
              </div>
              {!n.read && (
                <button className="text-sm underline" onClick={() => markRead([n.id])}>Mark read</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {items.some((i) => !i.read) && (
        <button className="px-3 py-1 text-sm bg-blue-600 text-white" onClick={() => markRead(items.filter(i => !i.read).map(i => i.id))}>
          Mark all read
        </button>
      )}
    </div>
  );
}
