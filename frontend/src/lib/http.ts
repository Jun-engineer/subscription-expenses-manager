import { API, refreshAccess } from "@/lib/auth";

export async function apiFetch(input: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const opts: RequestInit = {
    credentials: "include",
    ...init,
  };
  const res = await fetch(input.startsWith("http") ? input : `${API}${input}`, opts);
  if (res.status === 401 && retry) {
    try {
      await refreshAccess();
      return apiFetch(input, init, false);
    } catch {
      // fallthrough
    }
  }
  return res;
}

export async function apiJson<T = any>(input: string, init: RequestInit = {}, retry = true): Promise<T> {
  const res = await apiFetch(input, init, retry);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}
