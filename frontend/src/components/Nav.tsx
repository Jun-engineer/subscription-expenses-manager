"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { API } from "@/lib/auth";
import { useSession } from "@/lib/session";
import { useQueryClient } from "@tanstack/react-query";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/expenses", label: "Expenses" },
  { href: "/vault", label: "Vault" },
  { href: "/notifications", label: "Notifications", badge: true },
];

export default function Nav() {
  const { user, logout } = useSession();
  const qc = useQueryClient();
  const pathname = usePathname();
  const [unread, setUnread] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/v1/notifications`, { credentials: "include" });
        if (!res.ok) return;
        const items = await res.json();
        setUnread(items.filter((i: any) => !i.read).length);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user]);

  // Close mobile menu on navigate
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-40 border-b" style={{ background: "var(--card)", borderColor: "var(--card-border)" }}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="font-bold text-lg tracking-tight" style={{ color: "var(--accent)" }}>
          SubManager
        </Link>

        {user && (
          <>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive(link.href) ? "var(--accent-light)" : "transparent",
                    color: isActive(link.href) ? "var(--accent)" : "var(--muted)",
                  }}
                >
                  {link.label}
                  {link.badge && unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "var(--danger)" }}>
                      {unread}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* User area */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-xs truncate max-w-[160px]" style={{ color: "var(--muted)" }}>{user.email}</span>
              <button
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                onClick={async () => {
                  try { await logout(); } finally { window.location.replace("/"); }
                }}
              >Logout</button>
              <button
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                onClick={async () => {
                  if (!confirm("Delete your account and all data? This cannot be undone.")) return;
                  try {
                    const res = await fetch(`${API}/api/v1/auth/account`, { method: "DELETE", credentials: "include" });
                    if (!res.ok) throw new Error(await res.text());
                  } catch {}
                  try { await logout(); } catch {}
                  qc.setQueryData(["me"], null);
                  window.location.replace("/");
                }}
              >Delete</button>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg transition hover:opacity-70" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown */}
      {user && menuOpen && (
        <div className="md:hidden border-t px-4 pb-4 pt-2 space-y-1" style={{ borderColor: "var(--card-border)" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive(link.href) ? "var(--accent-light)" : "transparent",
                color: isActive(link.href) ? "var(--accent)" : "var(--foreground)",
              }}
            >
              {link.label}
              {link.badge && unread > 0 && (
                <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "var(--danger)" }}>
                  {unread}
                </span>
              )}
            </Link>
          ))}
          <div className="border-t pt-2 mt-2 space-y-1" style={{ borderColor: "var(--card-border)" }}>
            <p className="px-3 text-xs truncate" style={{ color: "var(--muted)" }}>{user.email}</p>
            <button
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ color: "var(--accent)" }}
              onClick={async () => {
                try { await logout(); } finally { window.location.replace("/"); }
              }}
            >Logout</button>
            <button
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{ color: "var(--danger)" }}
              onClick={async () => {
                if (!confirm("Delete your account and all data? This cannot be undone.")) return;
                try {
                  const res = await fetch(`${API}/api/v1/auth/account`, { method: "DELETE", credentials: "include" });
                  if (!res.ok) throw new Error(await res.text());
                } catch {}
                try { await logout(); } catch {}
                qc.setQueryData(["me"], null);
                window.location.replace("/");
              }}
            >Delete account</button>
          </div>
        </div>
      )}
    </nav>
  );
}
