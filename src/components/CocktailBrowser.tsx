"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, SlidersHorizontal, Heart } from "lucide-react";
import { setFavorite } from "@/app/(site)/cocktails/actions";
import CocktailCard from "@/components/CocktailCard";
import CocktailModal from "@/components/CocktailModal";
import { useMember } from "@/components/useMember";
import type { Cocktail } from "@/lib/content";

// "/cocktails?cocktail={slug}" opens that recipe, so a link (or the way back
// from /login) lands on it. Read in the browser: the page itself is static.
const OPEN_PARAM = "cocktail";

const baseAlcohols = ["Tümü", "Votka", "Cin", "Rom", "Viski", "Tekila"];
const flavors = ["Tümü", "Tatlı", "Ekşi", "Acı", "Baharatlı"];
const ingredientFilters = [
  "Nane",
  "Salatalık",
  "Tonik",
  "Lime",
  "Limon",
  "Zencefil",
  "Aquafaba",
  "Campari",
];

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

export default function CocktailBrowser({ cocktails }: { cocktails: Cocktail[] }) {
  const [search, setSearch] = useState("");
  const [selectedBase, setSelectedBase] = useState("Tümü");
  const [selectedFlavor, setSelectedFlavor] = useState("Tümü");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { member, favorites, markFavorite } = useMember();

  // Looked up by id so a revalidated page (a new average) updates the open card.
  const selectedCocktail = cocktails.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get(OPEN_PARAM);
    const match = slug && cocktails.find((c) => c.slug === slug);
    if (match) setSelectedId(match.id);
    // Only on arrival; later changes come from clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCocktail = (cocktail: Cocktail | null) => {
    setSelectedId(cocktail?.id ?? null);
    const url = new URL(window.location.href);
    if (cocktail) url.searchParams.set(OPEN_PARAM, cocktail.slug);
    else url.searchParams.delete(OPEN_PARAM);
    window.history.replaceState(window.history.state, "", url);
  };

  const toggleFavorite = async (cocktail: Cocktail) => {
    const on = !favorites.has(cocktail.id);
    markFavorite(cocktail.id, on);
    const result = await setFavorite(cocktail.id, on);
    if (result.error) {
      markFavorite(cocktail.id, !on);
      window.alert(result.error);
    }
  };

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedBase("Tümü");
    setSelectedFlavor("Tümü");
    setSelectedIngredients([]);
    setOnlyFavorites(false);
  };

  const hasActiveFilters =
    search ||
    selectedBase !== "Tümü" ||
    selectedFlavor !== "Tümü" ||
    selectedIngredients.length > 0 ||
    onlyFavorites;

  const filtered = useMemo(() => {
    return cocktails.filter((c) => {
      if (onlyFavorites && !favorites.has(c.id)) return false;

      if (search) {
        const searchTerms = expandSearchTerms(search);
        const searchable = [
          c.name.toLowerCase(),
          c.subtitle.toLowerCase(),
          c.baseAlcohol.toLowerCase(),
          ...c.tags.map((t) => t.toLowerCase()),
          ...c.ingredients.map((ing) => ing.name.toLowerCase()),
        ];
        const matchesSearch = searchTerms.some((q) =>
          searchable.some((s) => s.includes(q))
        );
        if (!matchesSearch) return false;
      }

      if (selectedBase !== "Tümü" && c.baseAlcohol !== selectedBase)
        return false;

      if (selectedFlavor !== "Tümü" && c.flavor !== selectedFlavor)
        return false;

      if (selectedIngredients.length > 0) {
        const cocktailIngNames = c.ingredients.map((ing) =>
          ing.name.toLowerCase()
        );
        const cocktailTags = c.tags.map((t) => t.toLowerCase());
        const allTerms = [...cocktailIngNames, ...cocktailTags];
        const matches = selectedIngredients.every((sel) =>
          allTerms.some((term) => term.includes(sel.toLowerCase()))
        );
        if (!matches) return false;
      }

      return true;
    });
  }, [cocktails, search, selectedBase, selectedFlavor, selectedIngredients, onlyFavorites, favorites]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <span className="mb-2 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
          Arşiv
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Kokteyller</h1>
        <p className="mt-2 font-mono text-sm text-text-muted">
          Hacı onaylı <b>{cocktails.length}</b> reçete.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kokteyl, malzeme veya etiket ara..."
            className="w-full rounded border border-border bg-bg-card py-2.5 pl-10 pr-4 font-mono text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-crimson-glow/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded border px-4 font-mono text-xs transition-colors ${
            showFilters
              ? "border-crimson/30 bg-crimson/10 text-crimson-glow"
              : "border-border bg-bg-card text-text-secondary hover:border-border-light"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtrele
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-8 space-y-5 rounded border border-border bg-bg-card/50 p-5">
          {/* Base alcohol */}
          <FilterRow label="Baz Alkol">
            {baseAlcohols.map((b) => (
              <FilterChip
                key={b}
                label={b}
                active={selectedBase === b}
                onClick={() => setSelectedBase(b)}
              />
            ))}
          </FilterRow>

          {/* Flavor */}
          <FilterRow label="Baskın Tat">
            {flavors.map((f) => (
              <FilterChip
                key={f}
                label={f}
                active={selectedFlavor === f}
                onClick={() => setSelectedFlavor(f)}
              />
            ))}
          </FilterRow>

          {/* Specific ingredients */}
          <FilterRow label="Malzeme">
            {ingredientFilters.map((ing) => (
              <FilterChip
                key={ing}
                label={ing}
                active={selectedIngredients.includes(ing)}
                onClick={() => toggleIngredient(ing)}
              />
            ))}
          </FilterRow>

          {member.state === "ok" && (
            <FilterRow label="Listem">
              <button
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`flex items-center gap-1.5 rounded-sm px-3 py-1 font-mono text-[11px] transition-colors ${
                  onlyFavorites
                    ? "bg-crimson/20 text-crimson-glow"
                    : "bg-bg-elevated text-text-muted hover:bg-bg-elevated/80 hover:text-text-secondary"
                }`}
              >
                <Heart className={`h-3 w-3 ${onlyFavorites ? "fill-crimson-glow" : ""}`} />
                Favorilerim ({favorites.size})
              </button>
            </FilterRow>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="font-mono text-[10px] uppercase tracking-wider text-text-muted underline underline-offset-2 transition-colors hover:text-crimson-glow"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
        {filtered.length} sonuç
        {hasActiveFilters && " (filtrelenmiş)"}
      </div>

      {/* Cocktail grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cocktail) => (
            <CocktailCard
              key={cocktail.id}
              cocktail={cocktail}
              favorite={favorites.has(cocktail.id)}
              onClick={() => openCocktail(cocktail)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="mb-2 text-text-secondary">Sonuç bulunamadı.</p>
          <button
            onClick={clearFilters}
            className="font-mono text-sm text-crimson-glow underline underline-offset-2"
          >
            Filtreleri temizle
          </button>
        </div>
      )}

      {/* Modal */}
      {selectedCocktail && (
        <CocktailModal
          cocktail={selectedCocktail}
          onClose={() => openCocktail(null)}
          member={member}
          favorite={favorites.has(selectedCocktail.id)}
          onToggleFavorite={() => toggleFavorite(selectedCocktail)}
        />
      )}
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-sm px-3 py-1 font-mono text-[11px] transition-colors ${
        active
          ? "bg-crimson/20 text-crimson-glow"
          : "bg-bg-elevated text-text-muted hover:bg-bg-elevated/80 hover:text-text-secondary"
      }`}
    >
      {label}
    </button>
  );
}
