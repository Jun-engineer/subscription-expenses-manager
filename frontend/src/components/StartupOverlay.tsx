"use client";

import { useEffect, useState } from "react";
import { API } from "@/lib/auth";

export default function StartupOverlay() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let delay = 1000;

    const check = async () => {
      try {
        const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(5000) });
        if (res.ok && !cancelled) {
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          // Retry with exponential backoff (max 8s)
          delay = Math.min(delay * 1.5, 8000);
          setTimeout(check, delay);
        }
      }
    };

    check();
    return () => { cancelled = true; };
  }, []);

  if (ready) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600" />
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
        App is starting&hellip;
      </p>
      <p className="text-sm text-gray-500">
        Please wait while the server wakes up.
      </p>
    </div>
  );
}
