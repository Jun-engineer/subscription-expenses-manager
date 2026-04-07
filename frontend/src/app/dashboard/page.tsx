"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

type Dashboard = {
  month: string;
  subscription_total: number;
  variable_total: number;
  breakdown: Record<string, number>;
  upcoming_payments: { id: string; name: string; amount: number; date: string }[];
};

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

  const total = useMemo(() => {
    if (!data) return 0;
    return Number((data.subscription_total + data.variable_total).toFixed(2));
  }, [data]);

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

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Subscriptions", value: data.subscription_total, color: "var(--accent)" },
              { label: "Variable", value: data.variable_total, color: "var(--success)" },
              { label: "Total", value: total, color: "var(--foreground)" },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-5 shadow-sm"
                style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}
              >
                <div className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--muted)" }}>{card.label}</div>
                <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Category Breakdown */}
          <div className="rounded-2xl p-5 shadow-sm" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--muted)" }}>Category Breakdown</h2>
            {Object.keys(data.breakdown).length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>No expense data this month</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(data.breakdown).map(([k, v]) => {
                  const pct = total > 0 ? (v / total) * 100 : 0;
                  return (
                    <div key={k}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{k}</span>
                        <span className="font-medium">{v.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--card-border)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: "var(--accent)" }} />
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
                      <span className="text-sm font-semibold">{u.amount.toFixed(2)}</span>
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
