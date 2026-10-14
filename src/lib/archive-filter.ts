// The archive's search and filters, shared by the site's CocktailBrowser and
// the Expo app (ADR-020). Browser-safe: no Next.js imports.

export const ALL = "Tümü";
export const BASE_ALCOHOLS = [ALL, "Votka", "Cin", "Rom", "Viski", "Tekila"];
export const FLAVORS = [ALL, "Tatlı", "Ekşi", "Acı", "Baharatlı"];
export const INGREDIENT_FILTERS = ["Nane", "Salatalık", "Tonik", "Lime", "Limon", "Zencefil", "Aquafaba", "Campari"];

const alcoholAliases: Record<string, string[]> = {
  votka: ["vodka"],
  vodka: ["votka"],
  cin: ["gin"],
  gin: ["cin"],
  rom: ["rum"],
  rum: ["rom"],
};

function expandSearchTerms(query: string): string[] {
  const q = query.toLowerCase();
  const terms = [q];
  for (const [key, aliases] of Object.entries(alcoholAliases)) {
    if (q.includes(key)) {
      for (const alias of aliases) {
        terms.push(q.replace(key, alias));
      }
    }
  }
  return terms;
}

/** The fields the filters read; both apps' Cocktail types fit it. */
export interface Filterable {
  id: string;
  name: string;
  subtitle: string;
  baseAlcohol: string;
  flavor: string;
  tags: string[];
  ingredients: { name: string }[];
}

export interface ArchiveFilters {
  search: string;
  base: string;
  flavor: string;
  ingredients: string[];
  /** The member's favourites when "Favorilerim" is on; null when it is off. */
  onlyFavorites: Set<string> | null;
}

export const NO_FILTERS: ArchiveFilters = { search: "", base: ALL, flavor: ALL, ingredients: [], onlyFavorites: null };

export function hasActiveFilters(f: ArchiveFilters): boolean {
  return Boolean(f.search || f.base !== ALL || f.flavor !== ALL || f.ingredients.length > 0 || f.onlyFavorites);
}

export function filterCocktails<T extends Filterable>(cocktails: T[], f: ArchiveFilters): T[] {
  return cocktails.filter((c) => {
    if (f.onlyFavorites && !f.onlyFavorites.has(c.id)) return false;

    if (f.search) {
      const searchTerms = expandSearchTerms(f.search);
      const searchable = [
        c.name.toLowerCase(),
        c.subtitle.toLowerCase(),
        c.baseAlcohol.toLowerCase(),
        ...c.tags.map((t) => t.toLowerCase()),
        ...c.ingredients.map((ing) => ing.name.toLowerCase()),
      ];
      if (!searchTerms.some((q) => searchable.some((s) => s.includes(q)))) return false;
    }

    if (f.base !== ALL && c.baseAlcohol !== f.base) return false;
    if (f.flavor !== ALL && c.flavor !== f.flavor) return false;

    if (f.ingredients.length > 0) {
      const allTerms = [...c.ingredients.map((ing) => ing.name.toLowerCase()), ...c.tags.map((t) => t.toLowerCase())];
      if (!f.ingredients.every((sel) => allTerms.some((term) => term.includes(sel.toLowerCase())))) return false;
    }

    return true;
  });
}
