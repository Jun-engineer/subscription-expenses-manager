"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { getMe } from "@/lib/auth";

type Expense = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category?: string | null;
  merchant?: string | null;
  notes?: string | null;
};

export default function ExpensesPage() {
  const [me, setMe] = useState<any | null>(null);
  const [items, setItems] = useState<Expense[]>([]);
  const [error, setError] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const { push } = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    currency: "JPY",
    category: "",
    merchant: "",
    notes: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: 0,
    currency: "JPY",
    category: "",
    merchant: "",
    notes: "",
  });

  useEffect(() => {
    getMe().then(setMe).catch(() => setMe(null));
  }, []);

  const load = async () => {
    if (!me) return;
    setError("");
    try {
      const url = new URL(`/api/v1/expenses`, window.location.origin);
      if (start) url.searchParams.set("start", start);
      if (end) url.searchParams.set("end", end);
      const data = await apiJson<Expense[]>(url.pathname + url.search);
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => { load(); }, [me]);

  const create = async () => {
    if (!me) return;
    setError("");
    if (!form.amount || form.amount <= 0) {
      push({ type: "error", message: "Amount must be positive" });
      return;
    }
    try {
      await apiJson(`/api/v1/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ ...form, amount: 0, category: "", merchant: "", notes: "" });
      push({ type: "success", message: "Expense added" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to add expense" });
    }
  };

  const del = async (id: string) => {
    if (!me) return;
    setError("");
    try {
      await apiJson(`/api/v1/expenses/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const startEdit = (x: Expense) => {
    setEditId(x.id);
    setEditForm({
      date: x.date,
      amount: x.amount,
      currency: x.currency,
      category: x.category || "",
      merchant: x.merchant || "",
      notes: x.notes || "",
    });
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    if (!me || !editId) return;
    setError("");
    try {
      await apiJson(`/api/v1/expenses/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditId(null);
      push({ type: "success", message: "Expense updated" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to update" });
    }
  };

  if (me === null && items.length === 0 && !error) return <div className="p-8">Loading...</div>;
  if (!me) return <div className="p-8">Please log in first.</div>;

  return (
    <div className="p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Expenses</h1>
      {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}

      <div className="flex items-center gap-2">
        <input className="border p-2" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <span>to</span>
        <input className="border p-2" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className="px-3 py-2 border" onClick={load}>Filter</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
        <input className="border p-2" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className="border p-2" placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
        <input className="border p-2" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        <input className="border p-2" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className="border p-2" placeholder="Merchant" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
        <input className="border p-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white" onClick={create}>Add</button>

      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.id} className="border p-3 rounded">
            {editId === x.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <input className="border p-2" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                  <input className="border p-2" type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} />
                  <input className="border p-2" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
                  <input className="border p-2" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                  <input className="border p-2" value={editForm.merchant} onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })} />
                  <input className="border p-2" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-green-600 text-white text-sm" onClick={saveEdit}>Save</button>
                  <button className="px-3 py-1 text-sm" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <a href={`/expenses/${x.id}`} className="block">
                  <div className="font-semibold underline">{x.amount} {x.currency}</div>
                  <div className="text-sm">{x.date} • {x.category || "-"} • {x.merchant || "-"}</div>
                </a>
                <div className="flex gap-3">
                  <button className="text-sm underline" onClick={() => startEdit(x)}>Edit</button>
                  <button className="text-sm text-red-600" onClick={() => del(x.id)}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
