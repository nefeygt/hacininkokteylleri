/**
 * The site's themes (ADR-028): a palette and a set of fonts each. "rx" is the default and needs no
 * attribute; the others set `data-theme` on <html> and their tokens live in globals.css.
 * `swatch` (background, accent) only draws the picker; keep it in step with globals.css.
 * Browser-safe, so the app can offer the same list in the parity pass.
 */
export const THEMES = [
  { id: "rx", name: "Rx", hint: "Varsayılan: koyu, kızıl", light: false, swatch: ["#0d0d0d", "#d0453a"] },
  { id: "night-bar", name: "Gece Barı", hint: "Sıcak koyu, kiraz kırmızısı", light: false, swatch: ["#17110f", "#e8505b"] },
  { id: "negroni", name: "Negroni", hint: "Koyu, acı portakal", light: false, swatch: ["#120d0b", "#f07a3a"] },
  { id: "night-serif", name: "Gece Serifi", hint: "Gece Barı, kâğıdın yazılarıyla", light: false, swatch: ["#17110f", "#e8505b"] },
  { id: "paper", name: "Reçete Kâğıdı", hint: "Açık, eczane kâğıdı", light: true, swatch: ["#eef1ed", "#b3212f"] },
  { id: "paper-rx", name: "Kâğıt Rx", hint: "Reçete Kâğıdı, Rx'in yazılarıyla", light: true, swatch: ["#eef1ed", "#b3212f"] },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "rx";

/** Where the visitor's choice is kept (localStorage), read before the first paint. */
export const THEME_STORAGE_KEY = "haci.theme";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

/**
 * Runs inline in <head> before anything paints, so a chosen theme never flashes the default.
 * Kept as a string: it must not wait for React.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(
  THEMES.map((theme) => theme.id).filter((id) => id !== DEFAULT_THEME),
)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`;
