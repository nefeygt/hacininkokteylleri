"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Leaf, ArrowUpRight } from "lucide-react";
import { recipeHref, type Cocktail } from "@/lib/content";
import CocktailReviews from "./CocktailReviews";
import RecipeActions from "./RecipeActions";
import RecipeDetails from "./RecipeDetails";
import type { Member } from "./useMember";

export default function CocktailModal({
  cocktail,
  onClose,
  member,
  favorite,
  onToggleFavorite,
}: {
  cocktail: Cocktail;
  onClose: () => void;
  member: Member;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-sm border border-border bg-bg-secondary shadow-2xl shadow-black/50">
        {/* Header accent */}
        <div
          className="shrink-0 h-1"
          style={{ backgroundColor: cocktail.color }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-5 z-20 flex h-8 w-8 items-center justify-center rounded text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="overflow-y-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
                {cocktail.baseAlcohol} · {cocktail.flavor} · {cocktail.glass}
              </span>
              {cocktail.vegan && (
                <span className="flex items-center gap-1 rounded bg-green-900/30 px-1.5 py-0.5 font-mono text-[9px] uppercase text-green-400">
                  <Leaf className="h-2.5 w-2.5" />
                  Vegan
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 pr-10">
              <h2 className="text-2xl font-bold tracking-tight">
                {cocktail.name}
              </h2>
              <RecipeActions cocktail={cocktail} member={member} favorite={favorite} onToggleFavorite={onToggleFavorite} />
            </div>
            <p className="mt-1 font-mono text-sm text-text-secondary">
              {cocktail.subtitle}
            </p>
            <Link
              href={recipeHref(cocktail.slug, Boolean(cocktail.author))}
              className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-crimson-glow"
            >
              Tarifin sayfası
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <RecipeDetails cocktail={cocktail} />

          <div className="mt-8">
            <CocktailReviews cocktail={cocktail} member={member} />
          </div>
        </div>
      </div>
    </div>
  );
}
