"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Check, X } from "lucide-react";
import CocktailCard from "@/components/CocktailCard";
import { useLocale } from "@/components/LocaleProvider";
import { format } from "@/lib/i18n/format";
import { recipeHref, type Cocktail } from "@/lib/content";
import { PANTRY_KEY, groupByCategory, matchCocktails, type CatalogueIngredient } from "@/lib/ingredients";

/** The visitor's picked ingredients, kept in localStorage; empty until read (and when storage is off). */
function usePantry(known: Set<string>): [Set<string>, (change: (current: Set<string>) => Set<string>) => void] {
  const [have, setHave] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PANTRY_KEY) ?? "[]");
      if (Array.isArray(stored)) setHave(new Set(stored.filter((id) => typeof id === "string" && known.has(id))));
    } catch {}
  }, [known]);
  const update = (change: (current: Set<string>) => Set<string>) => {
    setHave((current) => {
      const next = change(current);
      try {
        localStorage.setItem(PANTRY_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };
  return [have, update];
}

/** "Elimde ne var?" (ADR-029): pick what you have, see the house and members' recipes you can make. */
export default function WhatCanIMake({
  cocktails,
  catalogue,
}: {
  cocktails: Cocktail[];
  catalogue: CatalogueIngredient[];
}) {
  const { t, locale } = useLocale();
  const tw = t.whatCanIMake;
  // Only what some recipe uses, and never what is always at hand (water).
  const pickable = useMemo(() => {
    const used = new Set(cocktails.flatMap((c) => c.ingredients.map((i) => i.ingredientId)));
    return catalogue.filter((i) => used.has(i.id) && !i.alwaysAtHand);
  }, [cocktails, catalogue]);
  const known = useMemo(() => new Set(pickable.map((i) => i.id)), [pickable]);
  const [have, setHave] = usePantry(known);
  const { ready, oneShort } = useMemo(() => matchCocktails(cocktails, catalogue, have), [cocktails, catalogue, have]);

  function toggle(id: string) {
    setHave((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <span className="mb-2 inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
          {tw.eyebrow}
        </span>
        <h1 className="text-3xl font-bold tracking-tight">{tw.title}</h1>
        <p className="mt-2 max-w-xl text-sm text-text-muted">
          {tw.intro}
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
              {format(tw.selected, { n: have.size })}
            </span>
            {have.size > 0 && (
              <button
                type="button"
                onClick={() => setHave(() => new Set())}
                className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-crimson-glow"
              >
                <X className="h-3.5 w-3.5" /> {tw.clear}
              </button>
            )}
          </div>
          {groupByCategory(pickable, t, locale).map((g) => (
            <div key={g.value}>
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
                {g.label}
              </span>
              <div className="flex flex-wrap gap-2">
                {g.items.map((i) => {
                  const active = have.has(i.id);
                  return (
                    <button
                      key={i.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(i.id)}
                      className={`inline-flex items-center gap-1 rounded-sm px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "bg-crimson/20 text-crimson-glow"
                          : "bg-bg-elevated text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" />}
                      {i.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <div id="results" className="scroll-mt-24 space-y-10">
          {have.size === 0 ? (
            <p className="rounded-sm border border-dashed border-border p-6 text-sm text-text-muted">
              {tw.empty}
            </p>
          ) : (
            <>
              <section>
                <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">
                  {format(tw.canMake, { n: ready.length })}
                </h2>
                {ready.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    {tw.noneReady}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {ready.map((c) => (
                      <CocktailCard key={c.id} cocktail={c} href={recipeHref(c.slug, !!c.author)} />
                    ))}
                  </div>
                )}
              </section>
              {oneShort.length > 0 && (
                <section>
                  <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">
                    {format(tw.oneMissing, { n: oneShort.length })}
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {oneShort.map(({ cocktail, missing }) => (
                      <div key={cocktail.id}>
                        <CocktailCard cocktail={cocktail} href={recipeHref(cocktail.slug, !!cocktail.author)} />
                        <p className="mt-2 text-xs text-text-muted">
                          {tw.missing}<span className="text-text-secondary">{missing.name}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* On phones the chips push the results far down; this keeps the count in sight. */}
      {have.size > 0 && (
        <a
          href="#results"
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded bg-crimson px-4 py-3 text-sm text-white shadow-xl lg:hidden"
        >
          {format(tw.bar, { ready: ready.length, short: oneShort.length })}
          <ArrowDown className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
