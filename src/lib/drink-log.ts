// The drink log's recipe snapshot (M5, ADR-014), shared by the form, the
// server actions and the pages (browser-safe). The database's check function
// private.is_valid_log_recipe() is the rule; these limits mirror it so the
// form can warn early.

import type { IngredientIcon } from "./content";

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

const ICONS: readonly IngredientIcon[] = ["shot", "dash", "drop", "slice", "spoon", "topup"];

/**
 * Cleans a recipe the browser sent and checks it against the limits. Returns
 * the cleaned recipe, or a Turkish error for the member.
 */
export function cleanRecipe(input: unknown): LogRecipe | { error: string } {
  if (!input || typeof input !== "object") return { error: "Tarif okunamadı." };
  const r = input as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name.trim() : "";
  if (!name || name.length > LOG_LIMITS.name) return { error: "Tarifin adı okunamadı." };

  if (!Array.isArray(r.ingredients)) return { error: "Malzemeler okunamadı." };
  const ingredients: LogIngredient[] = [];
  for (const raw of r.ingredients) {
    const i = (raw ?? {}) as Record<string, unknown>;
    const ingredientName = typeof i.name === "string" ? i.name.trim() : "";
    const unit = typeof i.unit === "string" ? i.unit.trim() : "";
    const amount = typeof i.amount === "number" ? Math.round(i.amount * 100) / 100 : NaN;
    if (!ingredientName && !unit && Number.isNaN(amount)) continue; // an empty row the member left
    if (!ingredientName || ingredientName.length > LOG_LIMITS.ingredientName) {
      return { error: `Her malzemenin bir adı olmalı (en fazla ${LOG_LIMITS.ingredientName} karakter).` };
    }
    if (!(amount > 0) || amount > LOG_LIMITS.amount) return { error: `"${ingredientName}" için geçerli bir miktar yaz.` };
    if (!unit || unit.length > LOG_LIMITS.unit) return { error: `"${ingredientName}" için bir birim yaz (cl, dash, dilim…).` };
    const icon = ICONS.includes(i.icon as IngredientIcon) ? (i.icon as IngredientIcon) : "shot";
    ingredients.push({ name: ingredientName, amount, unit, icon });
  }
  if (ingredients.length === 0) return { error: "En az bir malzeme olmalı." };
  if (ingredients.length > LOG_LIMITS.ingredients) return { error: `En fazla ${LOG_LIMITS.ingredients} malzeme olabilir.` };

  const steps = Array.isArray(r.instructions) ? r.instructions : [];
  const instructions = steps
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  if (instructions.length > LOG_LIMITS.instructions) return { error: `En fazla ${LOG_LIMITS.instructions} adım olabilir.` };
  if (instructions.some((s) => s.length > LOG_LIMITS.step)) return { error: `Bir adım en fazla ${LOG_LIMITS.step} karakter olabilir.` };

  const garnish = typeof r.garnish === "string" ? r.garnish.trim() : "";
  if (garnish.length > LOG_LIMITS.garnish) return { error: `Süsleme en fazla ${LOG_LIMITS.garnish} karakter olabilir.` };
  const glass = typeof r.glass === "string" ? r.glass.trim() : "";
  if (glass.length > LOG_LIMITS.glass) return { error: `Bardak en fazla ${LOG_LIMITS.glass} karakter olabilir.` };

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

/** "4 cl", "1,5 dilim" — Turkish decimals. */
export function formatAmount(ingredient: Pick<LogIngredient, "amount" | "unit">): string {
  return `${ingredient.amount.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${ingredient.unit}`;
}

/** "14 Ekim 2026" for a date column ("2026-10-14"), without a time-zone shift. */
export function formatLogDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("tr-TR", {
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
