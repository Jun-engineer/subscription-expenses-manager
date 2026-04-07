import { StyleSheet } from "react-native";

export const colors = {
  accent: "#6366f1",
  accentLight: "#eef2ff",
  background: "#f8fafc",
  card: "#ffffff",
  cardBorder: "#e2e8f0",
  foreground: "#0f172a",
  muted: "#94a3b8",
  danger: "#ef4444",
  dangerLight: "#fef2f2",
  success: "#22c55e",
  successLight: "#f0fdf4",
};

export const darkColors = {
  accent: "#818cf8",
  accentLight: "#1e1b4b",
  background: "#030712",
  card: "#111827",
  cardBorder: "#1f2937",
  foreground: "#f8fafc",
  muted: "#64748b",
  danger: "#f87171",
  dangerLight: "#450a0a",
  success: "#4ade80",
  successLight: "#052e16",
};

export const shared = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center" as const,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonSecondary: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center" as const,
  },
  buttonSecondaryText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  empty: {
    textAlign: "center" as const,
    color: colors.muted,
    fontSize: 14,
    paddingVertical: 32,
  },
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },
  sub: {
    fontSize: 12,
    color: colors.muted,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "500",
    overflow: "hidden" as const,
  },
});

export function fmt(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
