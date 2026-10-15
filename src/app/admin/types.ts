import type { IngredientIcon } from "@/lib/content";
import type { CatalogueIngredient } from "@/lib/ingredients";

export interface IngredientInput {
  name: string;
  amount: number;
  unit: string;
  icon: IngredientIcon;
  /** The catalogue ingredient (ADR-029); "" until one is picked. */
  ingredientId: string;
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
  /** The ingredient catalogue every line picks from. */
  catalogue: CatalogueIngredient[];
}
