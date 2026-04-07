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

type Expense = {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category?: string | null;
  merchant?: string | null;
  notes?: string | null;
};

export default function ExpensesScreen() {
  const [items, setItems] = useState<Expense[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: "", currency: "JPY", category: "", merchant: "", notes: "" });
  const [curIdx, setCurIdx] = useState(0);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiJson<Expense[]>("/api/v1/expenses");
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const resetForm = () => {
    setForm({ date: new Date().toISOString().slice(0, 10), amount: "", currency: "JPY", category: "", merchant: "", notes: "" });
    setCurIdx(0);
    setEditId(null);
    setShowForm(false);
  };

  const save = async () => {
    const amountNum = parseFloat(form.amount);
    if (!form.date || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Validation", "Date and a positive amount are required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body: any = { date: form.date, amount: amountNum, currency: form.currency };
      if (form.category) body.category = form.category;
      if (form.merchant) body.merchant = form.merchant;
      if (form.notes) body.notes = form.notes;

      if (editId) {
        await apiJson(`/api/v1/expenses/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiJson("/api/v1/expenses", {
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
    Alert.alert("Delete", "Delete this expense?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiJson(`/api/v1/expenses/${id}`, { method: "DELETE" });
            await load();
          } catch (e: any) {
            setError(e.message || String(e));
          }
        },
      },
    ]);
  };

  const startEdit = (e: Expense) => {
    setEditId(e.id);
    setForm({ date: e.date, amount: String(e.amount), currency: e.currency, category: e.category || "", merchant: e.merchant || "", notes: e.notes || "" });
    setCurIdx(CURRENCIES.indexOf(e.currency));
    setShowForm(true);
  };

  return (
    <ScrollView
      style={shared.container}
      contentContainerStyle={shared.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Text style={[shared.title, { marginBottom: 0 }]}>Expenses</Text>
        <TouchableOpacity style={shared.button} onPress={() => { resetForm(); setShowForm(!showForm); }}>
          <Text style={shared.buttonText}>{showForm ? "Cancel" : "+ Add"}</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={shared.errorBox}><Text style={shared.errorText}>{error}</Text></View> : null}

      {showForm && (
        <View style={shared.card}>
          <Text style={shared.sectionTitle}>{editId ? "Edit Expense" : "New Expense"}</Text>
          <TextInput style={shared.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor={colors.muted} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} />
          <TextInput style={shared.input} placeholder="Amount" placeholderTextColor={colors.muted} value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v.replace(/[^0-9.]/g, "") })} keyboardType="decimal-pad" />

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

          <TextInput style={shared.input} placeholder="Category" placeholderTextColor={colors.muted} value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
          <TextInput style={shared.input} placeholder="Merchant" placeholderTextColor={colors.muted} value={form.merchant} onChangeText={(v) => setForm({ ...form, merchant: v })} />
          <TextInput style={shared.input} placeholder="Notes" placeholderTextColor={colors.muted} value={form.notes} onChangeText={(v) => setForm({ ...form, notes: v })} />

          <TouchableOpacity style={[shared.button, busy && { opacity: 0.6 }]} onPress={save} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={shared.buttonText}>{editId ? "Update" : "Add Expense"}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {items.length === 0 && !error && (
        <Text style={shared.empty}>No expenses yet. Tap + Add above.</Text>
      )}

      {items.map((e) => (
        <TouchableOpacity key={e.id} style={shared.card} onPress={() => startEdit(e)} activeOpacity={0.7}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text style={shared.label}>{e.merchant || e.category || "Expense"}</Text>
              <Text style={shared.sub}>{e.date} · {fmt(e.amount, e.currency)}{e.category ? ` · ${e.category}` : ""}</Text>
            </View>
            <TouchableOpacity onPress={() => del(e.id)} style={{ padding: 8 }}>
              <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
