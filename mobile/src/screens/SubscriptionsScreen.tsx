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
import { apiJson } from "../lib/api";
import { colors, shared, fmt } from "../lib/theme";

const CURRENCIES = ["JPY","USD","EUR","GBP","AUD","CAD","CHF","KRW","SGD","NZD","HKD","CNY","TWD","THB","INR","MYR","PHP","IDR","SEK","NOK","DKK","BRL","MXN"];
const CYCLES = ["monthly", "yearly", "weekly", "custom"];

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
  active: boolean;
  category?: string | null;
  notes?: string | null;
};

export default function SubscriptionsScreen() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", currency: "JPY", billing_cycle: "monthly" });
  const [curIdx, setCurIdx] = useState(0);
  const [cycleIdx, setCycleIdx] = useState(0);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiJson<Subscription[]>("/api/v1/subscriptions");
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => {
    setForm({ name: "", price: "", currency: "JPY", billing_cycle: "monthly" });
    setCurIdx(0);
    setCycleIdx(0);
    setEditId(null);
    setShowForm(false);
  };

  const save = async () => {
    const priceNum = parseFloat(form.price);
    if (!form.name || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Validation", "Name and a positive price are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = { name: form.name, price: priceNum, currency: form.currency, billing_cycle: form.billing_cycle };
      if (editId) {
        await apiJson(`/api/v1/subscriptions/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiJson("/api/v1/subscriptions", {
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

  const del = (id: string, name: string) => {
    Alert.alert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiJson(`/api/v1/subscriptions/${id}`, { method: "DELETE" });
            await load();
          } catch (e: any) {
            setError(e.message || String(e));
          }
        },
      },
    ]);
  };

  const startEdit = (s: Subscription) => {
    setEditId(s.id);
    setForm({ name: s.name, price: String(s.price), currency: s.currency, billing_cycle: s.billing_cycle });
    setCurIdx(CURRENCIES.indexOf(s.currency));
    setCycleIdx(CYCLES.indexOf(s.billing_cycle));
    setShowForm(true);
  };

  return (
    <ScrollView
      style={shared.container}
      contentContainerStyle={shared.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={[shared.title, { marginBottom: 0 }]}>Subscriptions</Text>
        <TouchableOpacity style={shared.button} onPress={() => { resetForm(); setShowForm(!showForm); }}>
          <Text style={shared.buttonText}>{showForm ? "Cancel" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={shared.errorBox}><Text style={shared.errorText}>{error}</Text></View> : null}

      {showForm && (
        <View style={shared.card}>
          <Text style={shared.sectionTitle}>{editId ? "Edit Subscription" : "New Subscription"}</Text>
          <TextInput style={shared.input} placeholder="Name" placeholderTextColor={colors.muted} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
          <TextInput style={shared.input} placeholder="Price" placeholderTextColor={colors.muted} value={form.price} onChangeText={(v) => setForm({ ...form, price: v.replace(/[^0-9.]/g, "") })} keyboardType="decimal-pad" />

          {/* Currency selector */}
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {CURRENCIES.map((c, i) => (
              <TouchableOpacity
                key={c}
                onPress={() => { setCurIdx(i); setForm({ ...form, currency: c }); }}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: curIdx === i ? colors.accent : colors.background, borderWidth: 1, borderColor: colors.cardBorder, marginRight: 6 }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: curIdx === i ? "#fff" : colors.foreground }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cycle */}
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Billing Cycle</Text>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 12 }}>
            {CYCLES.map((c, i) => (
              <TouchableOpacity
                key={c}
                onPress={() => { setCycleIdx(i); setForm({ ...form, billing_cycle: c }); }}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: cycleIdx === i ? colors.accent : colors.background, borderWidth: 1, borderColor: colors.cardBorder }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: cycleIdx === i ? "#fff" : colors.foreground }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[shared.button, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={shared.buttonText}>{editId ? "Update" : "Add Subscription"}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {items.length === 0 && !error && (
        <Text style={shared.empty}>No subscriptions yet. Tap + Add above.</Text>
      )}

      {items.map((s) => (
        <TouchableOpacity key={s.id} style={shared.card} onPress={() => startEdit(s)} activeOpacity={0.7}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={shared.label}>{s.name}</Text>
              <Text style={shared.sub}>
                {fmt(s.price, s.currency)} · {s.billing_cycle}
                {s.next_payment_date ? ` · Next: ${s.next_payment_date}` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => del(s.id, s.name)} style={{ padding: 8 }}>
              <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
