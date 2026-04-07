"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiJson } from "@/lib/http";
import { useSession } from "@/lib/session";
import AuthGuard from "@/components/AuthGuard";

export default function ExpenseDetail() {
  return (
    <AuthGuard>
      <ExpenseDetailContent />
    </AuthGuard>
  );
}

function ExpenseDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useSession();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!user || !id) return;
    setError("");
    apiJson(`/api/v1/expenses/${id}`)
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
      <h1 className="text-2xl font-bold">Expense</h1>
      <div className="space-y-2 border rounded-lg p-4 dark:border-gray-800">
        <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{data.date}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Amount</span><span>{data.amount} {data.currency}</span></div>
        {data.category && <div className="flex justify-between"><span className="text-gray-500">Category</span><span>{data.category}</span></div>}
        {data.merchant && <div className="flex justify-between"><span className="text-gray-500">Merchant</span><span>{data.merchant}</span></div>}
        {data.notes && <div className="flex justify-between"><span className="text-gray-500">Notes</span><span>{data.notes}</span></div>}
      </div>
    </div>
  );
}
