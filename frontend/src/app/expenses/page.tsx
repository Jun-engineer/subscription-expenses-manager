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
  const [busy, setBusy] = useState(false);
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
    if (!user || busy) return;
    setError("");
    const amountNum = Number((form.amount || "").toString().replace(/^0+(\d)/, "$1"));
    if (isNaN(amountNum) || amountNum <= 0) {
      push({ type: "error", message: "Amount must be positive" });
      return;
    }
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!user) return;
    if (!confirm("Delete this expense?")) return;
    setError("");
    try {
      await apiJson(`/api/v1/expenses/${id}`, { method: "DELETE" });
      push({ type: "success", message: "Expense deleted" });
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



  const inputStyle = { background: "var(--background)", border: "1px solid var(--card-border)" };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
      {error && <p className="text-sm rounded-xl p-3" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>{error}</p>}

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-2">
        <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <span className="text-sm" style={{ color: "var(--muted)" }}>to</span>
        <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={load}>Filter</button>
      </div>

      {/* Add form card */}
      <div className="rounded-2xl p-5 shadow-sm space-y-4" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Add Expense</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <span className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Date</span>
          </div>
          <input
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
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
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Merchant" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} />
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--accent)" }}
          onClick={create}
          disabled={busy}
        >{busy ? "Adding\u2026" : "Add Expense"}</button>
      </div>

      {/* List */}
      {items.length === 0 && !error && (
        <div className="text-center py-12 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No expenses yet. Add one above.</p>
        </div>
      )}
      <div className="space-y-3">
        {items.map((x) => (
          <div key={x.id} className="rounded-2xl p-4 shadow-sm transition-all" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            {editId === x.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                  <input
                    className="rounded-xl px-3 py-2 text-sm outline-none"
                    style={inputStyle}
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
                  <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
                  <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} placeholder="Category" />
                  <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.merchant} onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })} placeholder="Merchant" />
                  <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "var(--accent)" }} onClick={saveEdit}>Save</button>
                  <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: "var(--muted)" }} onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <a href={`/expenses/${x.id}`} className="flex-1 min-w-0 group">
                  <div className="font-semibold text-sm group-hover:underline">{x.amount} {x.currency}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {x.date}<span className="mx-1.5">&middot;</span>{x.category || "-"}<span className="mx-1.5">&middot;</span>{x.merchant || "-"}
                  </div>
                </a>
                <div className="flex gap-1 shrink-0">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={() => startEdit(x)}>Edit</button>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--danger-light)", color: "var(--danger)" }} onClick={() => del(x.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
