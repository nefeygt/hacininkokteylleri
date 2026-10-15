// The archive's search and filters, shared by the site's CocktailBrowser and
// the Expo app (ADR-020). Browser-safe: no Next.js imports.

export const ALL = "Tümü";
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

/** A flavour like "Tatlı-Ekşi" is two notes; the flavour filter matches either. */
export function flavorNotes(flavor: string): string[] {
  return flavor
    .split("-")
    .map((note) => note.trim())
    .filter(Boolean);
}

/** Distinct values, most common first (ties alphabetical), led by "Tümü". */
function choicesFrom(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const sorted = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b, "tr"));
  return [ALL, ...sorted];
}

/** The base-spirit chips: every base spirit in the archive, so a new one gets a chip. */
export function baseChoices(cocktails: Pick<Filterable, "baseAlcohol">[]): string[] {
  return choicesFrom(cocktails.map((c) => c.baseAlcohol.trim()).filter(Boolean));
}

/** The flavour chips: every note in the archive's flavours ("Tatlı-Ekşi" counts for both). */
export function flavorChoices(cocktails: Pick<Filterable, "flavor">[]): string[] {
  return choicesFrom(cocktails.flatMap((c) => flavorNotes(c.flavor)));
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

    if (f.base !== ALL && c.baseAlcohol.trim() !== f.base) return false;
    if (f.flavor !== ALL && !flavorNotes(c.flavor).includes(f.flavor)) return false;

    if (f.ingredients.length > 0) {
      const allTerms = [...c.ingredients.map((ing) => ing.name.toLowerCase()), ...c.tags.map((t) => t.toLowerCase())];
      if (!f.ingredients.every((sel) => allTerms.some((term) => term.includes(sel.toLowerCase())))) return false;
    }

    return true;
  });
}

/**
 * "Benzer kokteyller": the archive's recipes closest to `target` — the same base
 * spirit counts most, then each shared flavour note, then each shared tag. A
 * recipe sharing none of them is left out; ties keep the archive's order.
 */
export function similarCocktails<T extends Filterable>(target: T, cocktails: T[], limit: number): T[] {
  const notes = new Set(flavorNotes(target.flavor));
  const tags = new Set(target.tags.map((t) => t.toLowerCase()));
  return cocktails
    .filter((c) => c.id !== target.id)
    .map((c) => ({
      c,
      score:
        (c.baseAlcohol.trim() === target.baseAlcohol.trim() ? 3 : 0) +
        flavorNotes(c.flavor).filter((n) => notes.has(n)).length * 2 +
        c.tags.filter((t) => tags.has(t.toLowerCase())).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c }) => c);
}
