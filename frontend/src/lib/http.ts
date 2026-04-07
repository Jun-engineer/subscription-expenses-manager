import { API, refreshAccess } from "@/lib/auth";

/** Parse a backend error (Pydantic validation or detail string) into a readable message. */
export function parseApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  try {
    const json = JSON.parse(raw);
    // FastAPI validation error: { detail: [ { msg, loc, ... }, ... ] }
    if (Array.isArray(json?.detail)) {
      return json.detail
        .map((d: any) => {
          const field = (d.loc as string[])?.filter((l) => l !== "body").join(".") || "";
          const msg = (d.msg as string) || "";
          return field ? `${field}: ${msg}` : msg;
        })
        .join("\n");
    }
    // FastAPI error: { detail: "string" }
    if (typeof json?.detail === "string") return json.detail;
  } catch {
    // not JSON
  }
  return raw || "Something went wrong.";
}

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
    throw new Error(parseApiError(text) || `Request failed: ${res.status}`);
  }
  return res.json();
}
