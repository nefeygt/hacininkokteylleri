// A member's recipe as the form edits it (M6, ADR-018), shared by the form
// and the server actions (browser-safe). The database's check constraints
// (cocktails_community_limits, the ingredient lengths, save_recipe) are the
// rule; these limits mirror them so the form can warn early.

import { tr } from "./i18n/dictionaries/tr";
import type { Dictionary } from "./i18n/dictionaries/types";
import { format } from "./i18n/format";
import type { Database } from "./supabase/database.types";

type IngredientIcon = Database["public"]["Enums"]["ingredient_icon"];

// A type alias, not an interface, so it fits the generated Json type.
export type RecipeIngredient = {
  name: string;
  amount: number;
  unit: string;
  icon: IngredientIcon;
  /** The catalogue item (ADR-029); empty when the catalogue lacks it ("Katalogda yok"). */
  ingredientId?: string;
};

/** A line as save_recipe reads it: the catalogue link travels as ingredient_id. */
export type SavedRecipeIngredient = Omit<RecipeIngredient, "ingredientId"> & { ingredient_id: string | null };

export function toSavedIngredients(ingredients: RecipeIngredient[]): SavedRecipeIngredient[] {
  return ingredients.map(({ ingredientId, ...line }) => ({ ...line, ingredient_id: ingredientId || null }));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface RecipeInput {
  name: string;
  subtitle: string;
  baseAlcohol: string;
  flavor: string;
  tags: string[];
  color: string;
  imagePath: string | null;
  ingredients: RecipeIngredient[];
  instructions: string[];
  garnish: string;
  glass: string;
  vegan: boolean;
  note: string;
  isPublished: boolean;
}

export const RECIPE_LIMITS = {
  name: 100,
  subtitle: 200,
  baseAlcohol: 50,
  flavor: 50,
  tags: 10,
  tagsText: 300,
  ingredients: 30,
  ingredientName: 100,
  amount: 9999,
  unit: 20,
  instructions: 30,
  step: 500,
  garnish: 200,
  glass: 100,
  note: 2000,
} as const;

/** What each icon means on the recipe card (VisualQuantity draws one per unit). */
export const INGREDIENT_ICONS: { value: IngredientIcon; label: string }[] = [
  { value: "shot", label: "Shot / ölçü" },
  { value: "spoon", label: "Şurup / kaşık" },
  { value: "dash", label: "Az (dash)" },
  { value: "drop", label: "Damla / adet" },
  { value: "slice", label: "Dilim / yaprak" },
  { value: "topup", label: "Tamamla (top up)" },
];

const ICONS = INGREDIENT_ICONS.map((i) => i.value);

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Cleans a recipe the browser sent and checks it against the limits. Returns
 * the cleaned recipe, or an error for the member in the language of `v` (Turkish by default).
 */
export function cleanRecipeInput(
  input: RecipeInput,
  v: Dictionary["validation"] = tr.validation,
): RecipeInput | { error: string } {
  const L = RECIPE_LIMITS;
  const name = text(input.name);
  if (!name || name.length > L.name) return { error: format(v.nameRequired, { max: L.name }) };
  const subtitle = text(input.subtitle);
  if (subtitle.length > L.subtitle) return { error: format(v.subtitleMax, { max: L.subtitle }) };
  const baseAlcohol = text(input.baseAlcohol);
  if (!baseAlcohol || baseAlcohol.length > L.baseAlcohol) return { error: v.baseRequired };
  const flavor = text(input.flavor);
  if (!flavor || flavor.length > L.flavor) return { error: v.flavorRequired };

  const tags = [...new Set((Array.isArray(input.tags) ? input.tags : []).map(text).filter(Boolean))];
  if (tags.length > L.tags || tags.join(",").length > L.tagsText) {
    return { error: format(v.tagsMax, { max: L.tags }) };
  }

  const color = text(input.color);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: v.colorFormat };

  const ingredients: RecipeIngredient[] = [];
  for (const raw of Array.isArray(input.ingredients) ? input.ingredients : []) {
    const ingredientName = text(raw?.name);
    const unit = text(raw?.unit);
    const amount = typeof raw?.amount === "number" ? Math.round(raw.amount * 100) / 100 : NaN;
    if (!ingredientName && !unit && Number.isNaN(amount)) continue; // an empty row
    if (!ingredientName || ingredientName.length > L.ingredientName) {
      return { error: format(v.ingredientName, { max: L.ingredientName }) };
    }
    if (!(amount > 0) || amount > L.amount) return { error: format(v.amountInvalid, { name: ingredientName }) };
    if (!unit || unit.length > L.unit) return { error: format(v.unitMissing, { name: ingredientName }) };
    const icon = ICONS.includes(raw.icon) ? raw.icon : "shot";
    const ingredientId = typeof raw.ingredientId === "string" && UUID.test(raw.ingredientId) ? raw.ingredientId : undefined;
    ingredients.push({ name: ingredientName, amount, unit, icon, ingredientId });
  }
  if (ingredients.length === 0) return { error: v.ingredientsAddOne };
  if (ingredients.length > L.ingredients) return { error: format(v.ingredientsMax, { max: L.ingredients }) };

  const instructions = (Array.isArray(input.instructions) ? input.instructions : []).map(text).filter(Boolean);
  if (instructions.length === 0) return { error: v.stepsMin };
  if (instructions.length > L.instructions) return { error: format(v.stepsMax, { max: L.instructions }) };
  if (instructions.some((s) => s.length > L.step)) return { error: format(v.stepLength, { max: L.step }) };

  const garnish = text(input.garnish);
  if (garnish.length > L.garnish) return { error: format(v.garnishMax, { max: L.garnish }) };
  const glass = text(input.glass);
  if (glass.length > L.glass) return { error: format(v.glassMax, { max: L.glass }) };
  const note = text(input.note);
  if (note.length > L.note) return { error: format(v.noteMax, { max: L.note }) };

  return {
    name,
    subtitle,
    baseAlcohol,
    flavor,
    tags,
    color: color.toLowerCase(),
    imagePath: input.imagePath || null,
    ingredients,
    instructions,
    garnish,
    glass,
    vegan: Boolean(input.vegan),
    note,
    isPublished: Boolean(input.isPublished),
  };
}

/** "Kaç kişilik?": a recipe is for one glass; the page scales it up to this many. */
export const SERVINGS_MAX = 8;

/** An amount for `servings` glasses, rounded to two decimals (1,5 cl × 3 = 4,5 cl). */
export function scaleAmount(amount: number, servings: number): number {
  return Math.round(amount * servings * 100) / 100;
}

/** How a recipe shows its volumes: as written (cl, ml) or in ounces. */
export type VolumeUnit = "cl" | "oz";
export const VOLUME_UNITS: readonly VolumeUnit[] = ["cl", "oz"];

/** Where the cl/oz choice is kept (localStorage on the site, AsyncStorage in the app). */
export const VOLUME_UNIT_KEY = "haci.volume-unit";

/** The bar convention, not the exact 2,957 cl: 6 cl pours as 2 oz with a jigger. */
export const CL_PER_OZ = 3;
const CL_PER_UNIT: Record<string, number> = { cl: 1, ml: 0.1 };

/** Whether an amount in this unit is a volume the cl ↔ oz switch converts. */
export function isConvertibleUnit(unit: string): boolean {
  return unit in CL_PER_UNIT;
}

/**
 * An amount in the chosen volume unit. cl and ml become ounces rounded to a quarter
 * (never below ¼ oz); every other unit ("adet", "yaprak", …) and the "cl" choice pass through.
 */
export function convertAmount(
  amount: number,
  unit: string,
  to: VolumeUnit,
): { amount: number; unit: string } {
  if (to === "cl" || !isConvertibleUnit(unit)) return { amount, unit };
  const ounces = (amount * CL_PER_UNIT[unit]) / CL_PER_OZ;
  return { amount: Math.max(0.25, Math.round(ounces * 4) / 4), unit: "oz" };
}

const QUARTERS = ["", "¼", "½", "¾"];

/** An ounce amount as a bartender writes it: 1,5 → "1½", 0,25 → "¼". */
export function formatOunces(amount: number): string {
  const whole = Math.floor(amount);
  const quarter = QUARTERS[Math.round((amount - whole) * 4)] ?? "";
  return whole === 0 && quarter ? quarter : `${whole}${quarter}`;
}
