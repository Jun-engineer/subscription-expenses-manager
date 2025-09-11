export const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function loginWithCookie(email: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  const res = await fetch(`${API}/api/v1/auth/login-cookie`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function refreshAccess() {
  const res = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function logoutCookie() {
  await fetch(`${API}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
}

export async function getMe() {
  const res = await fetch(`${API}/api/v1/auth/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}