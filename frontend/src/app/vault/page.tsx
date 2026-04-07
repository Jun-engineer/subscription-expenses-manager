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
      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
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
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400 text-xs"
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

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Password Vault</h1>
      {error && <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 rounded-lg p-3">{error}</p>}

      {/* Add new entry */}
      <div className="border rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        <h2 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Add Credential</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            placeholder="Site name *"
            value={form.site_name}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            placeholder="URL (optional)"
            value={form.site_url}
            onChange={(e) => setForm({ ...form, site_url: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            placeholder="Username / Email *"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <div className="relative">
            <input
              className="border rounded-lg px-3 py-2 pr-16 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
              placeholder="Password *"
              type={showNewPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
              onClick={() => setShowNewPw(!showNewPw)}
              type="button"
            >
              {showNewPw ? "Hide" : "Show"}
            </button>
          </div>
          <input
            className="border rounded-lg px-3 py-2 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
          onClick={create}
        >
          Save
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No saved credentials yet. Add one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((v) => (
            <li key={v.id} className="border rounded-lg p-4 dark:border-gray-800">
              {editId === v.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={editForm.site_name} onChange={(e) => setEditForm({ ...editForm, site_name: e.target.value })} placeholder="Site name" />
                    <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={editForm.site_url} onChange={(e) => setEditForm({ ...editForm, site_url: e.target.value })} placeholder="URL" />
                    <input className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="Username" />
                    <div className="relative">
                      <input className="border rounded-lg px-3 py-2 pr-16 text-sm w-full dark:bg-gray-800 dark:border-gray-700" type={showEditPw ? "text" : "password"} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="Password" />
                      <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500" onClick={() => setShowEditPw(!showEditPw)} type="button">{showEditPw ? "Hide" : "Show"}</button>
                    </div>
                    <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2 dark:bg-gray-800 dark:border-gray-700" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Notes" />
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition" onClick={saveEdit}>Save</button>
                    <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{v.site_name}</span>
                      {v.site_url && (
                        <a href={v.site_url.startsWith("http") ? v.site_url : `https://${v.site_url}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate">
                          {v.site_url}
                        </a>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span>{v.username}</span>
                      <CopyButton text={v.username} />
                    </div>
                    <div className="text-sm">
                      <PasswordCell password={v.password} />
                    </div>
                    {v.notes && <div className="text-xs text-gray-500">{v.notes}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => startEdit(v)}>Edit</button>
                    <button className="px-3 py-1.5 text-sm text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition" onClick={() => del(v.id)}>Delete</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
