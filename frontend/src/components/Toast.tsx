"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" };

const ToastCtx = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = (t: Omit<Toast, "id">) => {
    const toast: Toast = { id: Date.now() + Math.random(), ...t };
    setItems((prev) => [...prev, toast]);
    setTimeout(() => setItems((prev) => prev.filter((x) => x.id !== toast.id)), t.type === "error" ? 5000 : 3000);
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {items.map((t) => (
          <div key={t.id} className={`px-4 py-2 rounded shadow text-white ${t.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}
