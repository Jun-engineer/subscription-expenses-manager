"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiJson } from "@/lib/http";
import { getMe } from "@/lib/auth";

export default function ExpenseDetail() {
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
    apiJson(`/api/v1/expenses/${id}`)
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [me, id]);

  if (me === null && !data && !error) return <div className="p-8">Loading...</div>;
  if (!me) return <div className="p-8">Please log in first.</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!data) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-4 max-w-xl mx-auto">
      <button className="underline" onClick={() => router.back()}>&larr; Back</button>
      <h1 className="text-2xl font-bold">Expense</h1>
      <div className="space-y-1">
        <div>Date: {data.date}</div>
        <div>Amount: {data.amount} {data.currency}</div>
        {data.category && <div>Category: {data.category}</div>}
        {data.merchant && <div>Merchant: {data.merchant}</div>}
        {data.notes && <div>Notes: {data.notes}</div>}
      </div>
    </div>
  );
}
