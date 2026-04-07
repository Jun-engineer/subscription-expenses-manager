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

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-4 max-w-xl mx-auto">
      <button className="text-sm rounded-lg px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition" onClick={() => router.back()}>&larr; Back</button>
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <div className="space-y-2 border rounded-lg p-4 dark:border-gray-800">
        <div className="flex justify-between"><span className="text-gray-500">Price</span><span>{data.price} {data.currency}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Cycle</span><span>{data.billing_cycle}</span></div>
        {data.billing_day && <div className="flex justify-between"><span className="text-gray-500">Billing day</span><span>{data.billing_day}</span></div>}
        {data.start_date && <div className="flex justify-between"><span className="text-gray-500">Start date</span><span>{data.start_date}</span></div>}
        {data.next_payment_date && <div className="flex justify-between"><span className="text-gray-500">Next payment</span><span>{data.next_payment_date}</span></div>}
        {data.payment_method && <div className="flex justify-between"><span className="text-gray-500">Payment method</span><span>{data.payment_method}</span></div>}
        <div className="flex justify-between"><span className="text-gray-500">Active</span><span>{String(data.active)}</span></div>
        {data.category && <div className="flex justify-between"><span className="text-gray-500">Category</span><span>{data.category}</span></div>}
        {data.notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span>{data.notes}</span></div>}
      </div>
    </div>
  );
}
