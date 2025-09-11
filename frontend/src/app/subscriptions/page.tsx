"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { getMe } from "@/lib/auth";

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
  const [me, setMe] = useState<any | null>(null);
  const [items, setItems] = useState<Subscription[]>([]);
  const [error, setError] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    price: 0,
    currency: "JPY",
    billing_cycle: "monthly",
  billing_day: undefined as number | undefined,
  start_date: "",
  });
  const { push } = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    currency: "JPY",
    billing_cycle: "monthly",
  });

  useEffect(() => {
    getMe().then(setMe).catch(() => setMe(null));
  }, []);

  const load = async () => {
    if (!me) return;
    setError("");
    try {
      const data = await apiJson<Subscription[]>(`/api/v1/subscriptions`);
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => { load(); }, [me]);

  const create = async () => {
    if (!me) return;
    setError("");
    if (!form.name || form.price <= 0) {
      push({ type: "error", message: "Name and positive price are required." });
      return;
    }
    try {
      await apiJson(`/api/v1/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: form.price,
          currency: form.currency,
          billing_cycle: form.billing_cycle,
          billing_day: form.billing_day || undefined,
          start_date: form.start_date || undefined,
        }),
      });
      setForm({ name: "", price: 0, currency: "JPY", billing_cycle: "monthly", billing_day: undefined, start_date: "" });
      push({ type: "success", message: "Subscription added" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to add subscription" });
    }
  };

  const del = async (id: string) => {
    if (!me) return;
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
      price: s.price,
      currency: s.currency,
      billing_cycle: s.billing_cycle,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async () => {
    if (!me || !editId) return;
    setError("");
    try {
      await apiJson(`/api/v1/subscriptions/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditId(null);
      push({ type: "success", message: "Subscription updated" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to update" });
    }
  };

  if (!me) return <div className="p-8">Please log in on the home page first.</div>;

  return (
    <div className="p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
        <input className="border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2" placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
        <input className="border p-2" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        <select className="border p-2" value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
          <option value="weekly">weekly</option>
          <option value="custom">custom</option>
        </select>
        <input className="border p-2" placeholder="Billing day (1-31)" type="number" value={form.billing_day ?? ""} onChange={(e) => setForm({ ...form, billing_day: e.target.value ? Number(e.target.value) : undefined })} />
        <input className="border p-2" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white" onClick={create}>Add</button>

      <ul className="space-y-2">
        {items.map((s) => (
          <li key={s.id} className="border p-3 rounded">
            {editId === s.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input className="border p-2" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className="border p-2" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
                  <input className="border p-2" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
                  <select className="border p-2" value={editForm.billing_cycle} onChange={(e) => setEditForm({ ...editForm, billing_cycle: e.target.value })}>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                    <option value="weekly">weekly</option>
                    <option value="custom">custom</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-sm" onClick={saveEdit}>Save</button>
                  <button className="px-3 py-1 text-sm" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <a href={`/subscriptions/${s.id}`} className="block">
                  <div className="font-semibold underline">{s.name}</div>
                  <div className="text-sm">{s.price} {s.currency} • {s.billing_cycle}</div>
                </a>
                <div className="flex gap-3">
                  <button className="text-sm underline" onClick={() => startEdit(s)}>Edit</button>
                  <button className="text-sm text-red-600" onClick={() => del(s.id)}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
