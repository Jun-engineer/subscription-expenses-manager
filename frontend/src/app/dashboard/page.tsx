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
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Month:</label>
        <input
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 dark:bg-red-950 rounded-lg p-3">{error}</p>}

    {data && (
        <div className="space-y-6">
  <p className="text-sm text-gray-500">Metrics for {data.month}. Subscription total counts actual scheduled charges within that month.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 dark:border-gray-800">
              <div className="text-sm text-gray-500">Subscription Total</div>
              <div className="text-xl font-semibold">{data.subscription_total.toFixed(2)}</div>
            </div>
            <div className="border rounded-lg p-4 dark:border-gray-800">
              <div className="text-sm text-gray-500">Variable Total</div>
              <div className="text-xl font-semibold">{data.variable_total.toFixed(2)}</div>
            </div>
            <div className="border rounded-lg p-4 dark:border-gray-800">
              <div className="text-sm text-gray-500">Month Total</div>
              <div className="text-xl font-semibold">{total.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Category Breakdown</h2>
            {Object.keys(data.breakdown).length === 0 ? (
              <p className="text-sm text-gray-500">No data</p>
            ) : (
              <ul className="space-y-1">
                {Object.entries(data.breakdown).map(([k, v]) => (
                  <li key={k} className="flex justify-between border rounded-lg p-3 dark:border-gray-800">
                    <span>{k}</span>
                    <span>{v.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Upcoming (7 days)</h2>
            {data.upcoming_payments.length === 0 ? (
              <p className="text-sm text-gray-500">No upcoming payments</p>
            ) : (
              <ul className="space-y-1">
                {data.upcoming_payments.map((u) => (
                  <li key={u.id} className="flex justify-between border rounded-lg p-3 dark:border-gray-800">
                    <span>{u.name}</span>
                    <span>{u.amount.toFixed(2)} &middot; {u.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
