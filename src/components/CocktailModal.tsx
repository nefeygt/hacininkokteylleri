"use client";

import { useEffect, useCallback } from "react";
import { X, Wine, Leaf } from "lucide-react";
import type { Cocktail } from "@/data/cocktails";
import VisualQuantity from "./VisualQuantity";
import { InstructionText } from "./Tooltip";

export default function CocktailModal({
  cocktail,
  onClose,
}: {
  cocktail: Cocktail;
  onClose: () => void;
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
            <h2 className="text-2xl font-bold tracking-tight">
              {cocktail.name}
            </h2>
            <p className="mt-1 font-mono text-sm text-text-secondary">
              {cocktail.subtitle}
            </p>
          </div>

          {/* Prescription-style divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="rx-symbol" />
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
              Malzemeler
            </h3>
            <div className="space-y-3 overflow-visible">
              {cocktail.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between overflow-visible border-b border-border/50 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="prescription-text text-text-primary">
                      <InstructionText text={ing.name} />
                    </span>
                  </div>
                  <VisualQuantity ingredient={ing} />
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-8">
            <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
              Hazırlanışı
            </h3>
            <ol className="space-y-3 overflow-visible">
              {cocktail.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 overflow-visible">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crimson/15 font-mono text-[10px] text-crimson-glow">
                    {i + 1}
                  </span>
                  <span className="prescription-text text-text-secondary">
                    <InstructionText text={step} />
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Garnish */}
          <div className="mb-6 rounded bg-bg-elevated/50 px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
              Süsleme:{" "}
            </span>
            <span className="prescription-text text-text-secondary">
              {cocktail.garnish}
            </span>
          </div>

          {/* Note */}
          {cocktail.note && (
            <div className="flex gap-3 border-t border-border pt-6">
              <Wine
                className="mt-0.5 h-4 w-4 shrink-0 text-crimson-glow/60"
                strokeWidth={1.5}
              />
              <p className="font-mono text-xs italic leading-relaxed text-text-muted">
                {cocktail.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
