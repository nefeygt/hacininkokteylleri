// The drink log's recipe snapshot (M5, ADR-014), shared by the form, the
// server actions and the pages (browser-safe). The database's check function
// private.is_valid_log_recipe() is the rule; these limits mirror it so the
// form can warn early.

import { tr } from "./i18n/dictionaries/tr";
import type { Dictionary } from "./i18n/dictionaries/types";
import { format } from "./i18n/format";
import { DEFAULT_LOCALE, INTL_LOCALES, type Locale } from "./i18n/locales";
import type { Database } from "./supabase/database.types";

type IngredientIcon = Database["public"]["Enums"]["ingredient_icon"];

// Type aliases, not interfaces, so they fit the generated Json type.
export type LogIngredient = {
  name: string;
  amount: number;
  unit: string;
  icon: IngredientIcon;
};

/** The recipe as made — the shape save_cocktail takes. */
export type LogRecipe = {
  name: string;
  ingredients: LogIngredient[];
  instructions: string[];
  garnish: string | null;
  glass: string | null;
};

export const LOG_NOTE_MAX_LENGTH = 2000;
export const LOG_LIMITS = {
  name: 100,
  ingredients: 30,
  ingredientName: 100,
  amount: 9999,
  unit: 20,
  instructions: 30,
  step: 500,
  garnish: 200,
  glass: 100,
} as const;

/**
 * The units a member picks from in the log form (and later the recipe form).
 * The database still takes any short unit, so old rows and house recipes with
 * other units stay valid; the forms offer such a unit next to these.
 */
export const UNITS = [
  "cl",
  "ml",
  "adet",
  "dilim",
  "yaprak",
  "dal",
  "demet",
  "tutam",
  "dash",
  "damla",
  "bar kaşığı",
  "çay kaşığı",
  "tatlı kaşığı",
  "yemek kaşığı",
  "kaşık",
] as const;

/**
 * A unit as the page's language writes it: "adet" → "piece(s)". The stored value stays the canonical one
 * (units are a controlled list); a unit the list does not know, or a Turkish page, shows as written.
 */
export function unitLabel(unit: string, amount: number, t: Dictionary = tr): string {
  const label = (t.units as Record<string, string>)[unit.trim()];
  if (!label) return unit;
  const [one, many] = label.split("|");
  return amount === 1 || many === undefined ? one : many;
}

/** The list, with `current` in front when it is not one of them (an older or house unit). */
export function unitChoices(current: string): string[] {
  const unit = current.trim();
  return unit && !(UNITS as readonly string[]).includes(unit) ? [unit, ...UNITS] : [...UNITS];
}

const ICONS: readonly IngredientIcon[] = ["shot", "dash", "drop", "slice", "spoon", "topup"];

/**
 * Cleans a recipe the browser sent and checks it against the limits. Returns
 * the cleaned recipe, or an error for the member in the language of `v` (Turkish by default).
 */
export function cleanRecipe(input: unknown, v: Dictionary["validation"] = tr.validation): LogRecipe | { error: string } {
  if (!input || typeof input !== "object") return { error: v.recipeUnreadable };
  const r = input as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name || name.length > LOG_LIMITS.name) return { error: v.recipeNameUnreadable };

  if (!Array.isArray(r.ingredients)) return { error: v.ingredientsUnreadable };
  const ingredients: LogIngredient[] = [];
  for (const raw of r.ingredients) {
    const i = (raw ?? {}) as Record<string, unknown>;
    const ingredientName = typeof i.name === "string" ? i.name.trim() : "";
    const unit = typeof i.unit === "string" ? i.unit.trim() : "";
    const amount = typeof i.amount === "number" ? Math.round(i.amount * 100) / 100 : NaN;
    if (!ingredientName && !unit && Number.isNaN(amount)) continue; // an empty row the member left
    if (!ingredientName || ingredientName.length > LOG_LIMITS.ingredientName) {
      return { error: format(v.ingredientName, { max: LOG_LIMITS.ingredientName }) };
    }
    if (!(amount > 0) || amount > LOG_LIMITS.amount) return { error: format(v.amountInvalid, { name: ingredientName }) };
    if (!unit || unit.length > LOG_LIMITS.unit) return { error: format(v.unitMissing, { name: ingredientName }) };
    const icon = ICONS.includes(i.icon as IngredientIcon) ? (i.icon as IngredientIcon) : "shot";
    ingredients.push({ name: ingredientName, amount, unit, icon });
  }
  if (ingredients.length === 0) return { error: v.ingredientsMin };
  if (ingredients.length > LOG_LIMITS.ingredients) return { error: format(v.ingredientsMax, { max: LOG_LIMITS.ingredients }) };

  const steps = Array.isArray(r.instructions) ? r.instructions : [];
  const instructions = steps
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  if (instructions.length > LOG_LIMITS.instructions) return { error: format(v.stepsMax, { max: LOG_LIMITS.instructions }) };
  if (instructions.some((s) => s.length > LOG_LIMITS.step)) return { error: format(v.stepLength, { max: LOG_LIMITS.step }) };

  const garnish = typeof r.garnish === "string" ? r.garnish.trim() : "";
  if (garnish.length > LOG_LIMITS.garnish) return { error: format(v.garnishMax, { max: LOG_LIMITS.garnish }) };
  const glass = typeof r.glass === "string" ? r.glass.trim() : "";
  if (glass.length > LOG_LIMITS.glass) return { error: format(v.glassMax, { max: LOG_LIMITS.glass }) };

  return { name, ingredients, instructions, garnish: garnish || null, glass: glass || null };
}

/** A stored snapshot, read defensively (it was valid when written). */
export function readRecipe(value: unknown): LogRecipe {
  const r = (value ?? {}) as Partial<LogRecipe>;
  return {
    name: typeof r.name === "string" ? r.name : "",
    ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
    instructions: Array.isArray(r.instructions) ? r.instructions : [],
    garnish: r.garnish ?? null,
    glass: r.glass ?? null,
  };
}

/** "4 cl", "1,5 dilim" / "1.5 slices" — the language's decimals and unit words. */
export function formatAmount(ingredient: Pick<LogIngredient, "amount" | "unit">, locale: Locale = DEFAULT_LOCALE, t?: Dictionary): string {
  const unit = t ? unitLabel(ingredient.unit, ingredient.amount, t) : ingredient.unit;
  return `${ingredient.amount.toLocaleString(INTL_LOCALES[locale], { maximumFractionDigits: 2 })} ${unit}`;
}

/** "14 Ekim 2026" for a date column ("2026-10-14"), without a time-zone shift. */
export function formatLogDate(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(INTL_LOCALES[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today in Turkey as "YYYY-MM-DD" — the default date of a new log. */
export function todayInTurkey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}
