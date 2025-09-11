"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, loginWithCookie, logoutCookie } from "@/lib/auth";

export function useSession() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });

  return {
    user: query.data,
    loading: query.isLoading,
    error: query.error as Error | null,
    async login(email: string, password: string) {
      await loginWithCookie(email, password);
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    async logout() {
      await logoutCookie();
      // Immediately clear local session so UI updates synchronously
      qc.setQueryData(["me"], null);
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    refresh() {
      return qc.invalidateQueries({ queryKey: ["me"] });
    },
  } as const;
}
