import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { apiJson } from "../lib/api";
import { colors, shared } from "../lib/theme";

type VaultEntry = {
  id: string;
  service_name: string;
  username: string;
  password_encrypted: string;
  url?: string | null;
  notes?: string | null;
};

export default function VaultScreen() {
  const [items, setItems] = useState<VaultEntry[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ service_name: "", username: "", password: "", url: "", notes: "" });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiJson<VaultEntry[]>("/api/v1/vault");
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => {
    setForm({ service_name: "", username: "", password: "", url: "", notes: "" });
    setEditId(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!form.service_name || !form.username || (!editId && !form.password)) {
      Alert.alert("Validation", "Service name, username, and password are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body: any = { service_name: form.service_name, username: form.username };
      if (form.password) body.password = form.password;
      if (form.url) body.url = form.url;
      if (form.notes) body.notes = form.notes;

      if (editId) {
        await apiJson(`/api/v1/vault/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiJson("/api/v1/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      resetForm();
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const del = (id: string) => {
    Alert.alert("Delete", "Delete this vault entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiJson(`/api/v1/vault/${id}`, { method: "DELETE" });
            await load();
          } catch (e: any) {
            setError(e.message || String(e));
          }
        },
      },
    ]);
  };

  const startEdit = (v: VaultEntry) => {
    setEditId(v.id);
    setForm({ service_name: v.service_name, username: v.username, password: "", url: v.url || "", notes: v.notes || "" });
    setShowForm(true);
  };

  const toggleReveal = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Copied to clipboard.");
  };

  return (
    <ScrollView
      style={shared.container}
      contentContainerStyle={shared.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={[shared.title, { marginBottom: 0 }]}>Password Vault</Text>
        <TouchableOpacity style={shared.button} onPress={() => { resetForm(); setShowForm(!showForm); }}>
          <Text style={shared.buttonText}>{showForm ? "Cancel" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={shared.errorBox}><Text style={shared.errorText}>{error}</Text></View> : null}

      {showForm && (
        <View style={shared.card}>
          <Text style={shared.sectionTitle}>{editId ? "Edit Entry" : "New Entry"}</Text>
          <TextInput style={shared.input} placeholder="Service name" placeholderTextColor={colors.muted} value={form.service_name} onChangeText={(v) => setForm({ ...form, service_name: v })} />
          <TextInput style={shared.input} placeholder="Username / Email" placeholderTextColor={colors.muted} value={form.username} onChangeText={(v) => setForm({ ...form, username: v })} autoCapitalize="none" />
          <TextInput style={shared.input} placeholder={editId ? "New password (leave empty to keep)" : "Password"} placeholderTextColor={colors.muted} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
          <TextInput style={shared.input} placeholder="URL (optional)" placeholderTextColor={colors.muted} value={form.url} onChangeText={(v) => setForm({ ...form, url: v })} autoCapitalize="none" keyboardType="url" />
          <TextInput style={shared.input} placeholder="Notes (optional)" placeholderTextColor={colors.muted} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />

          <TouchableOpacity style={[shared.button, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={shared.buttonText}>{editId ? "Update" : "Add Entry"}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {items.length === 0 && !error && (
        <Text style={shared.empty}>No vault entries yet. Tap + Add above.</Text>
      )}

      {items.map((v) => (
        <View key={v.id} style={shared.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={shared.label}>{v.service_name}</Text>
              <Text style={shared.sub}>{v.username}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                <Text style={{ color: colors.muted, fontSize: 13, fontFamily: "monospace" }}>
                  {revealed[v.id] ? v.password_encrypted : "••••••••••"}
                </Text>
                <TouchableOpacity onPress={() => toggleReveal(v.id)} style={{ marginLeft: 8 }}>
                  <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>
                    {revealed[v.id] ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
                {revealed[v.id] && (
                  <TouchableOpacity onPress={() => copyToClipboard(v.password_encrypted)} style={{ marginLeft: 8 }}>
                    <Text style={{ color: colors.accent, fontSize: 12, fontWeight: "600" }}>Copy</Text>
                  </TouchableOpacity>
                )}
              </View>
              {v.url ? <Text style={[shared.sub, { marginTop: 2 }]}>{v.url}</Text> : null}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => startEdit(v)} style={{ padding: 8 }}>
                <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => del(v.id)} style={{ padding: 8 }}>
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>Del</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
