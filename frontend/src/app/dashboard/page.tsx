"use client";

import { useEffect, useState } from "react";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

type CurrencyTotal = { subscriptions: number; expenses: number; total: number };
type Dashboard = {
  month: string;
  totals_by_currency?: Record<string, CurrencyTotal>;
  breakdown_by_currency?: Record<string, Record<string, number>>;
  // Legacy fields from old backend
  subscription_total?: number;
  variable_total?: number;
  breakdown?: Record<string, number>;
  upcoming_payments: { id: string; name: string; amount: number; currency?: string; date: string }[];
};

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function ym(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useSession();
  const [month, setMonth] = useState<string>(ym(new Date()));
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    setError("");
    apiJson<Dashboard>(`/api/v1/dashboard?month=${month}`)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [user, month]);

  // Normalize: support both new (per-currency) and legacy (flat) backend responses
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
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <input
          className="rounded-xl px-3 py-2 text-sm outline-none transition-all"
          style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
          onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
          onBlur={(e) => e.currentTarget.style.borderColor = "var(--card-border)"}
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {error && <p className="text-sm rounded-xl p-3" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>{error}</p>}

      {data && (
        <div className="space-y-6">
          <p className="text-sm" style={{ color: "var(--muted)" }}>Showing metrics for {data.month}</p>

          {/* Per-currency summary cards */}
          {currencies.length === 0 ? (
            <div className="text-center py-8 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>No data this month</p>
            </div>
          ) : currencies.map((cur) => {
            const t = totals[cur];
            return (
              <div key={cur}>
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>{cur}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Subscriptions", value: t.subscriptions, color: "var(--accent)" },
                    { label: "Expenses", value: t.expenses, color: "var(--success)" },
                    { label: "Total", value: t.total, color: "var(--foreground)" },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="rounded-2xl p-5 shadow-sm"
                      style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
                    >
                      <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>{card.label}</div>
                      <div className="text-2xl font-bold" style={{ color: card.color }}>{fmt(card.value, cur)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Category Breakdown */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>Category Breakdown</h2>
            {Object.keys(breakdowns).length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>No expense data this month</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(breakdowns).sort(([a], [b]) => a.localeCompare(b)).map(([cur, cats]) => {
                  const curTotal = Object.values(cats).reduce((a, b) => a + b, 0);
                  return (
                    <div key={cur}>
                      <h3 className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>{cur}</h3>
                      <div className="space-y-2">
                        {Object.entries(cats).map(([k, v]) => {
                          const pct = curTotal > 0 ? (v / curTotal) * 100 : 0;
                          return (
                            <div key={k}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{k}</span>
                                <span className="font-medium">{fmt(v, cur)}</span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: "var(--accent)" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Payments */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>Upcoming (7 days)</h2>
            {data.upcoming_payments.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>No upcoming payments</p>
            ) : (
              <div className="space-y-2">
                {data.upcoming_payments.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "var(--card-border)" }}>
                    <span className="font-medium text-sm">{u.name}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{fmt(u.amount, u.currency || "JPY")}</span>
                      <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>{u.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
