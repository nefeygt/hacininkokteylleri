import type { IngredientIcon } from "@/lib/content";

export interface IngredientInput {
  name: string;
  amount: number;
  unit: string;
  icon: IngredientIcon;
}

/** What the cocktail form edits and `saveCocktail` receives. */
export interface CocktailInput {
  id?: string;
  slug: string;
  name: string;
  subtitle: string;
  baseAlcohol: string;
  flavor: string;
  tags: string[];
  color: string;
  imagePath: string | null;
  ingredients: IngredientInput[];
  instructions: string[];
  garnish: string;
  glass: string;
  vegan: boolean;
  note: string;
  sortOrder: number;
  isPublished: boolean;
}

/** Values already used elsewhere, offered as suggestions in the form. */
export interface Suggestions {
  baseAlcohols: string[];
  flavors: string[];
  glasses: string[];
  units: string[];
}
