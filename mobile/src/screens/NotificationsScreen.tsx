import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { apiJson } from "../lib/api";
import { colors, shared, fmt } from "../lib/theme";

type Notif = {
  id: string;
  type: string;
  payload: any;
  read: boolean;
  created_at: string;
};

function formatPayload(n: Notif): string {
  if (n.type === "payment_due" && n.payload) {
    const p = typeof n.payload === "string" ? JSON.parse(n.payload) : n.payload;
    const name = p.subscription_name || "Subscription";
    const amt = p.amount != null ? fmt(p.amount, p.currency || "JPY") : "";
    const due = p.due_date ? ` due ${p.due_date}` : "";
    return `${name}${amt ? " — " + amt : ""}${due}`;
  }
  if (typeof n.payload === "string") return n.payload;
  return JSON.stringify(n.payload);
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<Notif[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await apiJson<Notif[]>("/api/v1/notifications");
      setItems(data);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const markRead = async (id: string) => {
    try {
      await apiJson(`/api/v1/notifications/${id}/read`, { method: "PATCH" });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await apiJson("/api/v1/notifications/mark-all-read", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = items.filter((n) => !n.read).length;

  return (
    <ScrollView
      style={shared.container}
      contentContainerStyle={shared.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View>
          <Text style={[shared.title, { marginBottom: 0 }]}>Notifications</Text>
          {unread > 0 && <Text style={{ fontSize: 12, color: colors.accent }}>{unread} unread</Text>}
        </View>
        {unread > 0 && (
          <TouchableOpacity style={shared.button} onPress={markAllRead} disabled={markingAll}>
            {markingAll ? <ActivityIndicator color="#fff" size="small" /> : <Text style={shared.buttonText}>Mark All Read</Text>}
          </TouchableOpacity>
        )}
      </View>

      {error ? <View style={shared.errorBox}><Text style={shared.errorText}>{error}</Text></View> : null}

      {items.length === 0 && !error && (
        <Text style={shared.empty}>No notifications.</Text>
      )}

      {items.map((n) => (
        <TouchableOpacity
          key={n.id}
          style={[shared.card, !n.read && { borderLeftWidth: 3, borderLeftColor: colors.accent }]}
          onPress={() => !n.read && markRead(n.id)}
          activeOpacity={n.read ? 1 : 0.7}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1 }}>
              <Text style={[shared.label, !n.read && { fontWeight: "700" }]}>
                {n.type === "payment_due" ? "Payment Due" : n.type}
              </Text>
              <Text style={shared.sub}>{formatPayload(n)}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                {new Date(n.created_at).toLocaleDateString()}
              </Text>
            </View>
            {!n.read && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 4 }} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
