// The site's palette and type (src/app/globals.css), in one place for the app.
// The app is dark only, like the site (ADR-015; a theme review is in the Icebox).

export const colors = {
  bgPrimary: "#0d0d0d",
  bgSecondary: "#161616",
  bgCard: "#1a1a1a",
  bgElevated: "#222222",
  crimson: "#8b1a1a",
  crimsonLight: "#a52a2a",
  crimsonGlow: "#c0392b",
  textPrimary: "#e8e6e3",
  textSecondary: "#9b9b9b",
  textMuted: "#6b6b6b",
  border: "#2a2a2a",
  borderLight: "#3a3a3a",
  vegan: "#4ade80",
  veganBg: "rgba(20, 83, 45, 0.6)",
} as const;

/** Font families, loaded in the root layout (Inter and JetBrains Mono, as on the site). */
export const fonts = {
  sans: "Inter_400Regular",
  sansBold: "Inter_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoItalic: "JetBrainsMono_400Regular_Italic",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Forms and account screens keep a readable width on tablets and the web. */
export const readable = { width: "100%", maxWidth: 520, alignSelf: "center" } as const;

/** A colour with an alpha, from "#rrggbb". */
export function alpha(hex: string, opacity: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}
