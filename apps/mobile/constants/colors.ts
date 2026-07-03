/** Shared colour palette for imperative styling (icons, native props). */
export const colors = {
  primary: "#4f46e5",
  primaryDark: "#4338ca",
  accent: "#7c3aed",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  white: "#ffffff",
  black: "#0f172a",
  gray: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
} as const;

export type Colors = typeof colors;
