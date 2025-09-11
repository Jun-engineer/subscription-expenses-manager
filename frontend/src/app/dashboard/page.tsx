"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/http";
import { getMe } from "@/lib/auth";

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
  const [me, setMe] = useState<any | null>(null);
  const [month, setMonth] = useState<string>(ym(new Date()));
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getMe().then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!me) return;
    setError("");
    apiJson<Dashboard>(`/api/v1/dashboard?month=${month}`)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [me, month]);

  const total = useMemo(() => {
    if (!data) return 0;
    return Number((data.subscription_total + data.variable_total).toFixed(2));
  }, [data]);

  if (me === null && !data && !error) return <div className="p-8">Loading...</div>;
  if (!me) return <div className="p-8">Please log in first.</div>;

  return (
    <div className="p-8 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="flex items-center gap-2">
        <label className="text-sm">Month:</label>
        <input
          className="border p-2"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border p-4 rounded">
              <div className="text-sm text-gray-500">Subscription Total</div>
              <div className="text-xl font-semibold">{data.subscription_total.toFixed(2)}</div>
            </div>
            <div className="border p-4 rounded">
              <div className="text-sm text-gray-500">Variable Total</div>
              <div className="text-xl font-semibold">{data.variable_total.toFixed(2)}</div>
            </div>
            <div className="border p-4 rounded">
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
                  <li key={k} className="flex justify-between border p-2 rounded">
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
                  <li key={u.id} className="flex justify-between border p-2 rounded">
                    <span>
                      {u.name}
                    </span>
                    <span>
                      {u.amount.toFixed(2)} • {u.date}
                    </span>
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
