import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { apiJson } from "../lib/api";
import { colors, shared, fmt } from "../lib/theme";

type CurrencyTotal = { subscriptions: number; expenses: number; total: number };
type Dashboard = {
  month: string;
  totals_by_currency?: Record<string, CurrencyTotal>;
  breakdown_by_currency?: Record<string, Record<string, number>>;
  subscription_total?: number;
  variable_total?: number;
  breakdown?: Record<string, number>;
  upcoming_payments: { id: string; name: string; amount: number; currency?: string; date: string }[];
};

function ym(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardScreen() {
  const [month, setMonth] = useState(ym(new Date()));
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const d = await apiJson<Dashboard>(`/api/v1/dashboard?month=${month}`);
      setData(d);
    } catch (e: any) {
      setError(e.message || String(e));
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Navigate month
  const shiftMonth = (dir: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setMonth(ym(d));
  };

  // Normalize old/new format
  let totals: Record<string, CurrencyTotal> = {};
  let breakdowns: Record<string, Record<string, number>> = {};
  if (data) {
    if (data.totals_by_currency) {
      totals = data.totals_by_currency;
    } else if (data.subscription_total !== undefined || data.variable_total !== undefined) {
      const s = data.subscription_total ?? 0;
      const e = data.variable_total ?? 0;
      totals = { JPY: { subscriptions: s, expenses: e, total: s + e } };
    }
    if (data.breakdown_by_currency) {
      breakdowns = data.breakdown_by_currency;
    } else if (data.breakdown) {
      breakdowns = { JPY: data.breakdown };
    }
  }
  const currencies = Object.keys(totals).sort();

  return (
    <ScrollView
      style={shared.container}
      contentContainerStyle={shared.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={shared.title}>Dashboard</Text>

      {/* Month picker */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => shiftMonth(-1)} style={{ padding: 8 }}>
          <Text style={{ fontSize: 18, color: colors.accent }}>◀</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>{data?.month || month}</Text>
        <TouchableOpacity onPress={() => shiftMonth(1)} style={{ padding: 8 }}>
          <Text style={{ fontSize: 18, color: colors.accent }}>▶</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={shared.errorBox}><Text style={shared.errorText}>{error}</Text></View>
      ) : null}

      {!data && !error && (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      )}

      {data && currencies.length === 0 && (
        <Text style={shared.empty}>No data this month</Text>
      )}

      {currencies.map((cur) => {
        const t = totals[cur];
        return (
          <View key={cur} style={{ marginBottom: 16 }}>
            <Text style={shared.sectionTitle}>{cur}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                { label: "Subs", value: t.subscriptions, color: colors.accent },
                { label: "Expenses", value: t.expenses, color: colors.success },
                { label: "Total", value: t.total, color: colors.foreground },
              ].map((c) => (
                <View key={c.label} style={[shared.card, { flex: 1, marginBottom: 0 }]}>
                  <Text style={{ fontSize: 10, fontWeight: "600", textTransform: "uppercase", color: colors.muted, marginBottom: 4 }}>{c.label}</Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: c.color }} numberOfLines={1}>{fmt(c.value, cur)}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* Category breakdown */}
      {Object.keys(breakdowns).length > 0 && (
        <View style={shared.card}>
          <Text style={shared.sectionTitle}>Category Breakdown</Text>
          {Object.entries(breakdowns).sort(([a], [b]) => a.localeCompare(b)).map(([cur, cats]) => {
            const curTotal = Object.values(cats).reduce((a, b) => a + b, 0);
            return (
              <View key={cur} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>{cur}</Text>
                {Object.entries(cats).map(([k, v]) => {
                  const pct = curTotal > 0 ? (v / curTotal) * 100 : 0;
                  return (
                    <View key={k} style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                        <Text style={{ fontSize: 13, color: colors.foreground }}>{k}</Text>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>{fmt(v, cur)}</Text>
                      </View>
                      <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.cardBorder }}>
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.accent, width: `${Math.min(pct, 100)}%` }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}

      {/* Upcoming payments */}
      {data && (
        <View style={shared.card}>
          <Text style={shared.sectionTitle}>Upcoming (7 days)</Text>
          {data.upcoming_payments.length === 0 ? (
            <Text style={shared.empty}>No upcoming payments</Text>
          ) : (
            data.upcoming_payments.map((u) => (
              <View key={u.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.foreground }}>{u.name}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{fmt(u.amount, u.currency || "JPY")}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{u.date}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
