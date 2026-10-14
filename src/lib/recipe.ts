// A member's recipe as the form edits it (M6, ADR-018), shared by the form
// and the server actions (browser-safe). The database's check constraints
// (cocktails_community_limits, the ingredient lengths, save_recipe) are the
// rule; these limits mirror them so the form can warn early.

import type { IngredientIcon } from "./content";

// A type alias, not an interface, so it fits the generated Json type.
export type RecipeIngredient = {
  name: string;
  amount: number;
  unit: string;
  icon: IngredientIcon;
};

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
 * the cleaned recipe, or a Turkish error for the member.
 */
export function cleanRecipeInput(input: RecipeInput): RecipeInput | { error: string } {
  const L = RECIPE_LIMITS;
  const name = text(input.name);
  if (!name || name.length > L.name) return { error: `Tarifin bir adı olmalı (en fazla ${L.name} karakter).` };
  const subtitle = text(input.subtitle);
  if (subtitle.length > L.subtitle) return { error: `Alt başlık en fazla ${L.subtitle} karakter olabilir.` };
  const baseAlcohol = text(input.baseAlcohol);
  if (!baseAlcohol || baseAlcohol.length > L.baseAlcohol) return { error: "Baz alkolü yaz (ör. Cin)." };
  const flavor = text(input.flavor);
  if (!flavor || flavor.length > L.flavor) return { error: "Baskın tadı yaz (ör. Ekşi)." };

  const tags = [...new Set((Array.isArray(input.tags) ? input.tags : []).map(text).filter(Boolean))];
  if (tags.length > L.tags || tags.join(",").length > L.tagsText) {
    return { error: `En fazla ${L.tags} etiket ekleyebilirsin.` };
  }

  const color = text(input.color);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "Renk #RRGGBB biçiminde olmalı." };

  const ingredients: RecipeIngredient[] = [];
  for (const raw of Array.isArray(input.ingredients) ? input.ingredients : []) {
    const ingredientName = text(raw?.name);
    const unit = text(raw?.unit);
    const amount = typeof raw?.amount === "number" ? Math.round(raw.amount * 100) / 100 : NaN;
    if (!ingredientName && !unit && Number.isNaN(amount)) continue; // an empty row
    if (!ingredientName || ingredientName.length > L.ingredientName) {
      return { error: `Her malzemenin bir adı olmalı (en fazla ${L.ingredientName} karakter).` };
    }
    if (!(amount > 0) || amount > L.amount) return { error: `"${ingredientName}" için geçerli bir miktar yaz.` };
    if (!unit || unit.length > L.unit) return { error: `"${ingredientName}" için bir birim yaz (cl, dash, dilim…).` };
    const icon = ICONS.includes(raw.icon) ? raw.icon : "shot";
    ingredients.push({ name: ingredientName, amount, unit, icon });
  }
  if (ingredients.length === 0) return { error: "En az bir malzeme ekle." };
  if (ingredients.length > L.ingredients) return { error: `En fazla ${L.ingredients} malzeme olabilir.` };

  const instructions = (Array.isArray(input.instructions) ? input.instructions : []).map(text).filter(Boolean);
  if (instructions.length === 0) return { error: "En az bir hazırlanış adımı yaz." };
  if (instructions.length > L.instructions) return { error: `En fazla ${L.instructions} adım olabilir.` };
  if (instructions.some((s) => s.length > L.step)) return { error: `Bir adım en fazla ${L.step} karakter olabilir.` };

  const garnish = text(input.garnish);
  if (garnish.length > L.garnish) return { error: `Süsleme en fazla ${L.garnish} karakter olabilir.` };
  const glass = text(input.glass);
  if (glass.length > L.glass) return { error: `Bardak en fazla ${L.glass} karakter olabilir.` };
  const note = text(input.note);
  if (note.length > L.note) return { error: `Not en fazla ${L.note} karakter olabilir.` };

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
