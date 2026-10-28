// The site's six themes for the app (src/app/globals.css, ADR-028, ADR-033): a palette and a set of
// fonts each. Keep the hex values in step with globals.css. `THEMES` (ids, names, swatches) comes
// from @shared/themes; the choice lives in theme-context.tsx.
import type { ThemeId } from "@shared/themes";

export type Palette = {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgElevated: string;
  crimson: string;
  crimsonLight: string;
  crimsonGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  vegan: string;
  /** Solid, like the site's --color-vegan-bg; wash it with alpha() where it sits on a card. */
  veganBg: string;
};

const rx: Palette = {
  bgPrimary: "#0d0d0d",
  bgSecondary: "#161616",
  bgCard: "#1a1a1a",
  bgElevated: "#222222",
  crimson: "#8b1a1a",
  crimsonLight: "#a52a2a",
  crimsonGlow: "#d0453a",
  textPrimary: "#e8e6e3",
  textSecondary: "#b4b1ae",
  textMuted: "#7d7a78",
  border: "#2a2a2a",
  borderLight: "#3a3a3a",
  vegan: "#4ade80",
  veganBg: "#14532d",
};

const nightBar: Palette = {
  bgPrimary: "#17110f",
  bgSecondary: "#1d1613",
  bgCard: "#221a16",
  bgElevated: "#2c221d",
  crimson: "#9e2430",
  crimsonLight: "#b72f3c",
  crimsonGlow: "#e8505b",
  textPrimary: "#f2e9e1",
  textSecondary: "#cdbfb4",
  textMuted: "#93857b",
  border: "#33271f",
  borderLight: "#45362c",
  vegan: "#7fd99a",
  veganBg: "#1e3a26",
};

const negroni: Palette = {
  bgPrimary: "#120d0b",
  bgSecondary: "#19120f",
  bgCard: "#1e1612",
  bgElevated: "#281d17",
  crimson: "#a8441c",
  crimsonLight: "#c0522a",
  crimsonGlow: "#f07a3a",
  textPrimary: "#f3e8de",
  textSecondary: "#cdb9a8",
  textMuted: "#8f7b6c",
  border: "#31241c",
  borderLight: "#433227",
  vegan: "#7fd99a",
  veganBg: "#1e3a26",
};

const paper: Palette = {
  bgPrimary: "#eef1ed",
  bgSecondary: "#e6eae5",
  bgCard: "#f7f9f6",
  bgElevated: "#dfe5de",
  crimson: "#9e1b2a",
  crimsonLight: "#b3212f",
  crimsonGlow: "#b3212f",
  textPrimary: "#1b2420",
  textSecondary: "#3e4a44",
  textMuted: "#66726b",
  border: "#cdd5cf",
  borderLight: "#b9c3bc",
  vegan: "#1f7a3f",
  veganBg: "#d4ecd9",
};

export const PALETTES: Record<ThemeId, Palette> = {
  rx,
  "night-bar": nightBar,
  negroni,
  "night-serif": nightBar,
  paper,
  "paper-rx": paper,
};

/** Family names as loaded in the root layout. `display` is for headings, `sans` for reading text, `mono` for labels and amounts. */
export type FontSet = {
  display: string;
  displayBold: string;
  sans: string;
  sansBold: string;
  mono: string;
  monoItalic: string;
};

const plexSans = { sans: "IBMPlexSans_400Regular", sansBold: "IBMPlexSans_700Bold" };
const jetBrains = { mono: "JetBrainsMono_400Regular", monoItalic: "JetBrainsMono_400Regular_Italic" };
const plexMono = { mono: "IBMPlexMono_400Regular", monoItalic: "IBMPlexMono_400Regular_Italic" };
const atkinson = { sans: "AtkinsonHyperlegible_400Regular", sansBold: "AtkinsonHyperlegible_700Bold" };

const rxFonts: FontSet = {
  display: plexSans.sans,
  displayBold: plexSans.sansBold,
  ...plexSans,
  ...jetBrains,
};

const serifFonts: FontSet = {
  // Instrument Serif has one weight: its bold is the regular face (a synthetic bold smears it).
  display: "InstrumentSerif_400Regular",
  displayBold: "InstrumentSerif_400Regular",
  ...atkinson,
  ...plexMono,
};

export const FONT_SETS: Record<ThemeId, FontSet> = {
  rx: rxFonts,
  "paper-rx": rxFonts,
  "night-bar": {
    display: "BricolageGrotesque_400Regular",
    displayBold: "BricolageGrotesque_700Bold",
    sans: "SourceSans3_400Regular",
    sansBold: "SourceSans3_700Bold",
    ...jetBrains,
  },
  negroni: {
    display: "BricolageGrotesque_400Regular",
    displayBold: "BricolageGrotesque_700Bold",
    ...atkinson,
    ...plexMono,
  },
  paper: serifFonts,
  "night-serif": serifFonts,
};

export type Theme = { id: ThemeId; light: boolean; colors: Palette; fonts: FontSet };

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
