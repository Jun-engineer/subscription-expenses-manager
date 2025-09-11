"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiJson } from "@/lib/http";
import { getMe } from "@/lib/auth";

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [me, setMe] = useState<any | null>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getMe().then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!me || !id) return;
    setError("");
    apiJson(`/api/v1/subscriptions/${id}`)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [me, id]);

  if (!me) return <div className="p-8">Please log in on the home page first.</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-4 max-w-xl mx-auto">
      <button className="underline" onClick={() => router.back()}>&larr; Back</button>
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <div className="space-y-1">
        <div>Price: {data.price} {data.currency}</div>
        <div>Cycle: {data.billing_cycle}</div>
        {data.billing_day && <div>Billing day: {data.billing_day}</div>}
        {data.start_date && <div>Start date: {data.start_date}</div>}
        {data.next_payment_date && <div>Next payment: {data.next_payment_date}</div>}
        {data.payment_method && <div>Payment method: {data.payment_method}</div>}
        <div>Active: {String(data.active)}</div>
        {data.category && <div>Category: {data.category}</div>}
        {data.notes && <div>Notes: {data.notes}</div>}
      </div>
    </div>
  );
}
