"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

type VaultEntry = {
  id: string;
  site_name: string;
  site_url?: string | null;
  username: string;
  password: string;
  notes?: string | null;
};

function CopyButton({ text }: { text: string }) {
  const { push } = useToast();
  return (
    <button
      className="p-1 rounded-lg transition-all hover:opacity-80"
      style={{ color: "var(--muted)" }}
      title="Copy"
      onClick={() => {
        navigator.clipboard.writeText(text);
        push({ type: "success", message: "Copied!" });
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
  );
}

function PasswordCell({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-sm">{show ? password : "••••••••"}</span>
      <button
        className="px-1.5 py-0.5 rounded-md text-[10px] font-medium transition-all hover:opacity-80"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
        onClick={() => setShow(!show)}
        title={show ? "Hide" : "Show"}
      >
        {show ? "Hide" : "Show"}
      </button>
      <CopyButton text={password} />
    </span>
  );
}

export default function VaultPage() {
  return (
    <AuthGuard>
      <VaultContent />
    </AuthGuard>
  );
}

function VaultContent() {
  const { user } = useSession();
  const [items, setItems] = useState<VaultEntry[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ site_name: "", site_url: "", username: "", password: "", notes: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ site_name: "", site_url: "", username: "", password: "", notes: "" });
  const [showNewPw, setShowNewPw] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);
  const { push } = useToast();

  const load = async () => {
    setError("");
    try {
      const data = await apiJson<VaultEntry[]>("/api/v1/vault");
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const create = async () => {
    if (!form.site_name || !form.username || !form.password) {
      push({ type: "error", message: "Site name, username, and password are required." });
      return;
    }
    setError("");
    try {
      await apiJson("/api/v1/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({ site_name: "", site_url: "", username: "", password: "", notes: "" });
      setShowNewPw(false);
      push({ type: "success", message: "Credential saved" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to save" });
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this credential?")) return;
    try {
      await apiJson(`/api/v1/vault/${id}`, { method: "DELETE" });
      push({ type: "success", message: "Deleted" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const startEdit = (v: VaultEntry) => {
    setEditId(v.id);
    setEditForm({
      site_name: v.site_name,
      site_url: v.site_url || "",
      username: v.username,
      password: v.password,
      notes: v.notes || "",
    });
    setShowEditPw(false);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setError("");
    try {
      await apiJson(`/api/v1/vault/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditId(null);
      push({ type: "success", message: "Updated" });
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
      push({ type: "error", message: "Failed to update" });
    }
  };

  const inputStyle = { background: "var(--background)", border: "1px solid var(--card-border)" };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Password Vault</h1>
      {error && <p className="text-sm rounded-xl p-3" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>{error}</p>}

      {/* Add new entry */}
      <div className="rounded-2xl p-5 shadow-sm space-y-4" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Add Credential</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Site name *" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} />
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="URL (optional)" value={form.site_url} onChange={(e) => setForm({ ...form, site_url: e.target.value })} />
          <input className="rounded-xl px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="Username / Email *" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <div className="relative">
            <input className="rounded-xl px-3 py-2.5 pr-16 text-sm w-full outline-none" style={inputStyle} placeholder="Password *" type={showNewPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-all hover:opacity-80" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={() => setShowNewPw(!showNewPw)} type="button">{showNewPw ? "Hide" : "Show"}</button>
          </div>
          <input className="rounded-xl px-3 py-2.5 text-sm sm:col-span-2 outline-none" style={inputStyle} placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "var(--accent)" }} onClick={create}>Save Credential</button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No saved credentials yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((v) => (
            <div key={v.id} className="rounded-2xl p-4 shadow-sm transition-all" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              {editId === v.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.site_name} onChange={(e) => setEditForm({ ...editForm, site_name: e.target.value })} placeholder="Site name" />
                    <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.site_url} onChange={(e) => setEditForm({ ...editForm, site_url: e.target.value })} placeholder="URL" />
                    <input className="rounded-xl px-3 py-2 text-sm outline-none" style={inputStyle} value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="Username" />
                    <div className="relative">
                      <input className="rounded-xl px-3 py-2 pr-16 text-sm w-full outline-none" style={inputStyle} type={showEditPw ? "text" : "password"} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Password" />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-all hover:opacity-80" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={() => setShowEditPw(!showEditPw)} type="button">{showEditPw ? "Hide" : "Show"}</button>
                    </div>
                    <input className="rounded-xl px-3 py-2 text-sm sm:col-span-2 outline-none" style={inputStyle} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "var(--accent)" }} onClick={saveEdit}>Save</button>
                    <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ color: "var(--muted)" }} onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{v.site_name}</span>
                      {v.site_url && (
                        <a href={v.site_url.startsWith("http") ? v.site_url : `https://${v.site_url}`} target="_blank" rel="noopener noreferrer" className="text-xs truncate hover:underline" style={{ color: "var(--accent)" }}>
                          {v.site_url}
                        </a>
                      )}
                    </div>
                    <div className="text-sm flex items-center gap-1" style={{ color: "var(--muted)" }}>
                      <span>{v.username}</span>
                      <CopyButton text={v.username} />
                    </div>
                    <div className="text-sm">
                      <PasswordCell password={v.password} />
                    </div>
                    {v.notes && <div className="text-xs" style={{ color: "var(--muted)" }}>{v.notes}</div>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={() => startEdit(v)}>Edit</button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80" style={{ background: "var(--danger-light)", color: "var(--danger)" }} onClick={() => del(v.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
