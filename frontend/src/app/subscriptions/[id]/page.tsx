"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

export default function SubscriptionDetail() {
  return (
    <AuthGuard>
      <SubscriptionDetailContent />
    </AuthGuard>
  );
}

function SubscriptionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user || !id) return;
    setError("");
    apiJson(`/api/v1/subscriptions/${id}`)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [user, id]);

  if (error) return <div className="p-8" style={{ color: "var(--danger)" }}>{error}</div>;
  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--accent)" }} />
    </div>
  );

  const rows = [
    ["Price", `${data.price} ${data.currency}`],
    ["Cycle", data.billing_cycle],
    data.billing_day && ["Billing day", data.billing_day],
    data.start_date && ["Start date", data.start_date],
    data.next_payment_date && ["Next payment", data.next_payment_date],
    data.payment_method && ["Payment method", data.payment_method],
    ["Active", String(data.active)],
    data.category && ["Category", data.category],
    data.notes && ["Notes", data.notes],
  ].filter(Boolean) as [string, string][];

  return (
    <div className="p-4 sm:p-8 space-y-4 max-w-xl mx-auto">
      <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--accent-light)", color: "var(--accent)" }} onClick={() => router.back()}>&larr; Back</button>
      <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--card-border)" }}>
        {rows.map(([label, value], i) => (
          <div key={label} className="flex justify-between px-5 py-3 text-sm" style={i < rows.length - 1 ? { borderBottom: "1px solid var(--card-border)" } : {}}>
            <span style={{ color: "var(--muted)" }}>{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
