import * as SecureStore from "expo-secure-store";

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || "https://sem-api-664895081493.asia-northeast1.run.app";

const TOKEN_KEY = "access_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export async function apiJson<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    let msg = `Request failed: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (typeof json?.detail === "string") msg = json.detail;
      else if (Array.isArray(json?.detail)) {
        msg = json.detail.map((d: any) => d.msg || "").join(", ");
      }
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<void> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = "Login failed";
    try {
      const json = JSON.parse(text);
      if (typeof json?.detail === "string") msg = json.detail;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  await setToken(data.access_token);
}

export async function signup(email: string, password: string, displayName?: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, display_name: displayName || undefined }),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = "Signup failed";
    try {
      const json = JSON.parse(text);
      if (typeof json?.detail === "string") msg = json.detail;
    } catch {}
    throw new Error(msg);
  }
}
