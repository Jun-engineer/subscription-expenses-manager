"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

const CURRENCIES = ["JPY","USD","EUR","GBP","AUD","CAD","CHF","KRW","SGD","NZD","HKD","CNY","TWD","THB","INR","MYR","PHP","IDR","SEK","NOK","DKK","BRL","MXN"] as const;

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
  const [busy, setBusy] = useState(false);
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
    if (!user || busy) return;
    setError("");
    const priceNum = Number((form.price || "").toString().replace(/^0+(\d)/, "$1"));
    if (!form.name || isNaN(priceNum) || priceNum <= 0) {
      push({ type: "error", message: "Name and positive price are required." });
      return;
    }
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    if (!user) return;
    if (!confirm("Delete this subscription?")) return;
    setError("");
    try {
      await apiJson(`/api/v1/subscriptions/${id}`, { method: "DELETE" });
      push({ type: "success", message: "Subscription deleted" });
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



  const inputStyle = { background: "var(--background)", border: "1px solid var(--card-border)" };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
      {error && <p className="text-sm rounded-xl p-3" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>{error}</p>}

      {/* Add form card */}
      <div className="rounded-2xl p-5 shadow-sm space-y-4" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Add Subscription</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none sm:col-span-2" style={inputStyle} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="Price"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => {
              let v = e.target.value;
              if (v === "") return setForm({ ...form, price: "" });
              v = v.replace(/[^0-9.]/g, "");
              const parts = v.split(".");
              if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
              v = v.replace(/^0+(\d)/, "$1");
              setForm({ ...form, price: v });
            }}
          />
          <select className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
          <select className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} value={form.billing_cycle} onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom</option>
          </select>
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Billing day (1-31)" type="number" value={form.billing_day ?? ""} onChange={(e) => setForm({ ...form, billing_day: e.target.value ? Number(e.target.value) : undefined })} />
          <div className="flex flex-col">
            <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <span className="text-[10px] mt-1" style={{ color: "var(--muted)" }}>Start date</span>
          </div>
        </div>
        <button
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--accent)" }}
          onClick={create}
          disabled={busy}
        >{busy ? "Adding\u2026" : "Add Subscription"}</button>
      </div>

      {/* List */}
      {items.length === 0 && !error && (
        <div className="text-center py-12 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No subscriptions yet. Add one above.</p>
        </div>
      )}
      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="rounded-2xl p-4 shadow-sm transition-all" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            {editId === s.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input
                    className="rounded-xl px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                    inputMode="decimal"
                    value={editForm.price}
                    onChange={(e) => {
                      let v = e.target.value;
                      if (v === "") return setEditForm({ ...editForm, price: "" });
                      v = v.replace(/[^0-9.]/g, "");
                      const parts = v.split(".");
                      if (parts.length > 2) v = parts[0] + "." + parts.slice(1).join("");
                      v = v.replace(/^0+(\d)/, "$1");
                      setEditForm({ ...editForm, price: v });
                    }}
                  />
                  <select className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                  <select className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.billing_cycle} onChange={(e) => setEditForm({ ...editForm, billing_cycle: e.target.value })}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "var(--accent)" }} onClick={saveEdit}>Save</button>
                  <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: "var(--muted)" }} onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <a href={`/subscriptions/${s.id}`} className="flex-1 min-w-0 group">
                  <div className="font-semibold text-sm group-hover:underline">{s.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    <span className="font-medium" style={{ color: "var(--foreground)" }}>{s.price} {s.currency}</span>
                    <span className="mx-1.5">&middot;</span>{s.billing_cycle}
                    {s.next_payment_date && <><span className="mx-1.5">&middot;</span>Next: {s.next_payment_date}</>}
                  </div>
                </a>
                <div className="flex gap-1 shrink-0">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={() => startEdit(s)}>Edit</button>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--danger-light)", color: "var(--danger)" }} onClick={() => del(s.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
