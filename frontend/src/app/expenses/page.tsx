"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

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
  return (
    <AuthGuard>
      <ExpensesContent />
    </AuthGuard>
  );
}

function ExpensesContent() {
  const { user } = useSession();
  const [items, setItems] = useState<Expense[]>([]);
  const [error, setError] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const { push } = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    currency: "JPY",
    category: "",
    merchant: "",
    notes: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    currency: "JPY",
    category: "",
    merchant: "",
    notes: "",
  });

  const load = async () => {
    if (!user) return;
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

  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user) return;
    setError("");
    const amountNum = Number((form.amount || "").toString().replace(/^0+(\d)/, "$1"));
    if (isNaN(amountNum) || amountNum <= 0) {
      push({ type: "error", message: "Amount must be positive" });
      return;
    }
    try {
      await apiJson(`/api/v1/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: amountNum }),
      });
      setForm({ ...form, amount: "", category: "", merchant: "", notes: "" });
      push({ type: "success", message: "Expense added" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to add expense" });
    }
  };

  const del = async (id: string) => {
    if (!user) return;
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
      amount: String(x.amount),
      currency: x.currency,
      category: x.category || "",
      merchant: x.merchant || "",
      notes: x.notes || "",
    });
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    if (!user || !editId) return;
    setError("");
    try {
      const amountNum = Number((editForm.amount || "").toString().replace(/^0+(\d)/, "$1"));
      if (isNaN(amountNum) || amountNum <= 0) {
        push({ type: "error", message: "Amount must be positive" });
        return;
      }
      await apiJson(`/api/v1/expenses/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, amount: amountNum }),
      });
      setEditId(null);
      push({ type: "success", message: "Expense updated" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to update" });
    }
  };



  return (
    <div className="p-4 sm:p-8 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Expenses</h1>
      {error && <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 rounded-lg p-3">{error}</p>}

      <div className="flex items-center gap-2">
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <span className="text-sm">to</span>
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={load}>Filter</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input
          className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
          placeholder="Amount"
          inputMode="decimal"
          value={form.amount}
          onChange={(e) => {
            let v = e.target.value;
            if (v === "") return setForm({ ...form, amount: "" });
            v = v.replace(/[^0-9.]/g, "");
            const parts = v.split(".");
            if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
            v = v.replace(/^0+(\d)/, "$1");
            setForm({ ...form, amount: v });
          }}
        />
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" placeholder="Merchant" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
        <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition" onClick={create}>Add</button>

      <ul className="space-y-2">
        {items.map((x) => (
          <li key={x.id} className="border rounded-lg p-3 dark:border-gray-800">
            {editId === x.id ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                  <input
                    className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700"
                    inputMode="decimal"
                    value={editForm.amount}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (v === "") return setEditForm({ ...editForm, amount: "" });
                      v = v.replace(/[^0-9.]/g, "");
                      const parts = v.split(".");
                      if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
                      v = v.replace(/^0+(\d)/, "$1");
                      setEditForm({ ...editForm, amount: v });
                    }}
                  />
                  <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" value={editForm.merchant} onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })} />
                  <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-900 dark:border-gray-700" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition" onClick={saveEdit}>Save</button>
                  <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <a href={`/expenses/${x.id}`} className="block">
                  <div className="font-semibold underline">{x.amount} {x.currency}</div>
                  <div className="text-sm">{x.date} • {x.category || "-"} • {x.merchant || "-"}</div>
                </a>
                <div className="flex gap-3">
                  <button className="text-sm rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => startEdit(x)}>Edit</button>
                  <button className="text-sm text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950 transition" onClick={() => del(x.id)}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
