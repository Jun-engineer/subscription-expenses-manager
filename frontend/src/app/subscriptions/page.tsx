"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

type Subscription = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  billing_interval?: number;
  billing_day?: number | null;
  start_date?: string | null;
  next_payment_date?: string | null;
  payment_method?: string | null;
  active: boolean;
  category?: string | null;
  notes?: string | null;
};

export default function SubscriptionsPage() {
  return (
    <AuthGuard>
      <SubscriptionsContent />
    </AuthGuard>
  );
}

function SubscriptionsContent() {
  const { user } = useSession();
  const [items, setItems] = useState<Subscription[]>([]);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    price: "", // keep as string to avoid leading zero issues
    currency: "JPY",
    billing_cycle: "monthly",
    billing_day: undefined as number | undefined,
    start_date: "",
  });
  const { push } = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    currency: "JPY",
    billing_cycle: "monthly",
  });

  const load = async () => {
    if (!user) return;
    setError("");
    try {
      const data = await apiJson<Subscription[]>(`/api/v1/subscriptions`);
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user) return;
    setError("");
  const priceNum = Number((form.price || "").toString().replace(/^0+(\d)/, "$1"));
  if (!form.name || isNaN(priceNum) || priceNum <= 0) {
      push({ type: "error", message: "Name and positive price are required." });
      return;
    }
    try {
      await apiJson(`/api/v1/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
      price: priceNum,
          currency: form.currency,
          billing_cycle: form.billing_cycle,
          billing_day: form.billing_day || undefined,
          start_date: form.start_date || undefined,
        }),
      });
    setForm({ name: "", price: "", currency: "JPY", billing_cycle: "monthly", billing_day: undefined, start_date: "" });
      push({ type: "success", message: "Subscription added" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to add subscription" });
    }
  };

  const del = async (id: string) => {
    if (!user) return;
    setError("");
    try {
      await apiJson(`/api/v1/subscriptions/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const startEdit = (s: Subscription) => {
    setEditId(s.id);
    setEditForm({
      name: s.name,
      price: String(s.price ?? ""),
      currency: s.currency,
      billing_cycle: s.billing_cycle,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async () => {
    if (!user || !editId) return;
    setError("");
    try {
      const priceNum = Number((editForm.price || "").toString().replace(/^0+(\d)/, "$1"));
      if (isNaN(priceNum) || priceNum <= 0) {
        push({ type: "error", message: "Price must be a positive number." });
        return;
      }
      await apiJson(`/api/v1/subscriptions/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, price: priceNum }),
      });
      setEditId(null);
      push({ type: "success", message: "Subscription updated" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to update" });
    }
  };



  return (
    <div className="p-4 sm:p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      {error && <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 rounded-lg p-3">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-start">
        <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          placeholder="Price"
          inputMode="decimal"
          value={form.price}
          onChange={(e) => {
            // Allow empty, digits, optional single dot; strip leading zeros gracefully
            let v = e.target.value;
            if (v === "") return setForm({ ...form, price: "" });
            // Keep only digits and at most one dot
            v = v.replace(/[^0-9.]/g, "");
            const parts = v.split(".");
            if (parts.length > 2) {
              v = parts[0] + "." + parts.slice(1).join("");
            }
            // Trim leading zeros unless immediately followed by dot or the value is just "0"
            v = v.replace(/^0+(\d)/, "$1");
            setForm({ ...form, price: v });
          }}
        />
        <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        <select className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
          <option value="weekly">weekly</option>
          <option value="custom">custom</option>
        </select>
        <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700" placeholder="Billing day of month (1-31)" type="number" value={form.billing_day ?? ""} onChange={(e) => setForm({ ...form, billing_day: e.target.value ? Number(e.target.value) : undefined })} />
        <div className="flex flex-col sm:col-span-1">
          <input className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          <span className="text-[11px] text-gray-600 mt-1">Start date (used to seed next payment date).</span>
        </div>
      </div>
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition" onClick={create}>Add</button>

      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="border rounded-lg p-3 dark:border-gray-800">
            {editId === s.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                    inputMode="decimal"
                    value={editForm.price}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (v === "") return setEditForm({ ...editForm, price: "" });
                      v = v.replace(/[^0-9.]/g, "");
                      const parts = v.split(".");
                      if (parts.length > 2) {
                        v = parts[0] + "." + parts.slice(1).join("");
                      }
                      v = v.replace(/^0+(\d)/, "$1");
                      setEditForm({ ...editForm, price: v });
                    }}
                  />
                  <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
                  <select className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" value={editForm.billing_cycle} onChange={(e) => setEditForm({ ...editForm, billing_cycle: e.target.value })}>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                    <option value="weekly">weekly</option>
                    <option value="custom">custom</option>
                  </select>
                </div>
                <div className="text-xs text-gray-600">Billing day is used for monthly cycles. Leave blank if not applicable.</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition" onClick={saveEdit}>Save</button>
                  <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <a href={`/subscriptions/${s.id}`} className="block">
                  <div className="font-semibold underline">{s.name}</div>
                  <div className="text-sm">{s.price} {s.currency} • {s.billing_cycle}</div>
                </a>
                <div className="flex gap-3">
                  <button className="text-sm rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => startEdit(s)}>Edit</button>
                  <button className="text-sm text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950 transition" onClick={() => del(s.id)}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
