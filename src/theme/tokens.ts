export const colors = {
  background: "#0B0F17",
  surface: "#141A24",
  surfaceAlt: "#1C2433",
  border: "#222C3D",
  borderHover: "#2E3B52",
  emerald: "#10B981",
  cobalt: "#3B82F6",
  amber: "#F59E0B",
  coral: "#F43F5E",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textDim: "#64748B"
} as const;

export const typography = {
  ui: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", monospace'
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14
} as const;

export const motion = {
  fast: "150ms ease",
  normal: "250ms cubic-bezier(0.16, 1, 0.3, 1)"
} as const;
