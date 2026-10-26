"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "@/components/LocaleLink";
import { Search, X, SlidersHorizontal, Heart } from "lucide-react";
import { setFavorite } from "@/app/[lang]/(site)/cocktails/actions";
import CocktailCard from "@/components/CocktailCard";
import CocktailModal from "@/components/CocktailModal";
import { CollectionLinks } from "@/components/CollectionView";
import { useMember } from "@/components/useMember";
import {
  ALL,
  INGREDIENT_FILTERS as ingredientFilters,
  baseChoices,
  flavorChoices,
  filterCocktails,
  hasActiveFilters as anyActive,
  readArchiveQuery,
  sortCocktails,
  SORT_LABELS,
  writeArchiveQuery,
  type ArchiveSort,
} from "@/lib/archive-filter";
import { collections } from "@/lib/collections";
import { recipeHref, type Cocktail } from "@/lib/content";

// A card opens the recipe's page; its magnifier opens the recipe over the
// archive (ADR-025). "/cocktails?cocktail={slug}" still opens that card, so
// older links keep working. Read in the browser: the page itself is static.
const OPEN_PARAM = "cocktail";

export default function CocktailBrowser({ cocktails }: { cocktails: Cocktail[] }) {
  const [search, setSearch] = useState("");
  const [selectedBase, setSelectedBase] = useState(ALL);
  const [selectedFlavor, setSelectedFlavor] = useState(ALL);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const spiritCollections = useMemo(() => collections("spirit", cocktails), [cocktails]);
  const flavorCollections = useMemo(() => collections("flavor", cocktails), [cocktails]);
  const [showFilters, setShowFilters] = useState(true);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const { member, favorites, markFavorite } = useMember();
  const baseAlcohols = useMemo(() => baseChoices(cocktails), [cocktails]);
  const flavors = useMemo(() => flavorChoices(cocktails), [cocktails]);

  // Looked up by id so a revalidated page (a new average) updates the open card.
  const selectedCocktail = cocktails.find((c) => c.id === selectedId) ?? null;

  const [sort, setSort] = useState<ArchiveSort>("default");
  // The address is read once on arrival (the page itself is static), then kept in step.
  const [queryRead, setQueryRead] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get(OPEN_PARAM);
    const match = slug && cocktails.find((c) => c.slug === slug);
    if (match) setSelectedId(match.id);
    const q = readArchiveQuery(params);
    setSearch(q.search);
    setSelectedBase(q.base);
    setSelectedFlavor(q.flavor);
    setSelectedIngredients(q.ingredients);
    setSort(q.sort);
    setQueryRead(true);
    // Only on arrival; later changes come from clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!queryRead) return;
    const url = new URL(window.location.href);
    writeArchiveQuery(url.searchParams, {
      search,
      base: selectedBase,
      flavor: selectedFlavor,
      ingredients: selectedIngredients,
      sort,
    });
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [queryRead, search, selectedBase, selectedFlavor, selectedIngredients, sort]);

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
    setSelectedBase(ALL);
    setSelectedFlavor(ALL);
    setSelectedIngredients([]);
    setOnlyFavorites(false);
  };

  const filters = {
    search,
    base: selectedBase,
    flavor: selectedFlavor,
    ingredients: selectedIngredients,
    onlyFavorites: onlyFavorites ? favorites : null,
  };
  const hasActiveFilters = anyActive(filters);

  const filtered = useMemo(
    () => sortCocktails(filterCocktails(cocktails, filters), sort),
    // filters is rebuilt every render; its parts are the real dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cocktails, search, selectedBase, selectedFlavor, selectedIngredients, onlyFavorites, favorites, sort]
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <span className="mb-2 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
          Arşiv
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Kokteyller</h1>
        <p className="mt-2 text-sm text-text-muted">
          Hacı onaylı <b>{cocktails.length}</b> reçete.{" "}
          <Link href="/what-can-i-make" className="text-crimson-glow hover:underline">
            Elimde ne var? →
          </Link>
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
            aria-label="Kokteyl ara"
            className="w-full rounded border border-border bg-bg-card py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-crimson-glow/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Aramayı temizle"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded border px-4 text-xs transition-colors ${
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

      {/* Results count and the order (M9 package D) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
          {filtered.length} sonuç
          {hasActiveFilters && " (filtrelenmiş)"}
        </div>
        <div role="group" aria-label="Sırala" className="flex items-center gap-1">
          {(Object.keys(SORT_LABELS) as ArchiveSort[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
              className={`rounded-sm px-2.5 py-1 font-mono text-[11px] transition-colors ${
                sort === key
                  ? "bg-crimson/20 text-crimson-glow"
                  : "text-text-muted hover:bg-bg-elevated hover:text-text-secondary"
              }`}
            >
              {SORT_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Cocktail grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cocktail) => (
            <CocktailCard
              key={cocktail.id}
              cocktail={cocktail}
              favorite={favorites.has(cocktail.id)}
              href={recipeHref(cocktail.slug, false)}
              onPreview={() => openCocktail(cocktail)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="mb-2 text-text-secondary">Sonuç bulunamadı.</p>
          <button
            onClick={clearFilters}
            className="text-sm text-crimson-glow underline underline-offset-2"
          >
            Filtreleri temizle
          </button>
        </div>
      )}

      {/* The collections' landing pages (M9 package C): crawlable paths into the archive. */}
      <section className="mt-16 space-y-5 border-t border-border pt-8">
        <CollectionLinks heading="Baz içkiye göre" items={spiritCollections} />
        <CollectionLinks heading="Tada göre" items={flavorCollections} />
        <p className="text-xs text-text-muted">
          Altı çizili terimler ne demek?{" "}
          <Link href="/glossary" className="text-crimson-glow hover:underline">
            Kokteyl sözlüğü →
          </Link>
        </p>
      </section>

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
