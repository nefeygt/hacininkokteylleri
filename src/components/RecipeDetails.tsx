"use client";

import { useState } from "react";
import { Minus, Plus, Wine } from "lucide-react";
import type { Cocktail } from "@/lib/content";
import { SERVINGS_MAX, scaleAmount } from "@/lib/recipe";
import VisualQuantity from "./VisualQuantity";
import { InstructionText } from "./Tooltip";

/**
 * The prescription itself: ingredients, steps, garnish and note. Shared by the
 * archive's card (house recipes) and a member's recipe page (M6), so one
 * recipe shape has one renderer (ADR-014). "Kaç kişilik?" scales the amounts
 * for up to SERVINGS_MAX glasses; the steps stay as written.
 */
export default function RecipeDetails({ cocktail }: { cocktail: Cocktail }) {
  const [servings, setServings] = useState(1);

  return (
    <>
      {/* Prescription-style divider */}
      <div className="mb-6 flex items-center gap-3">
        <div className="rx-symbol" />
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Ingredients */}
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
            Malzemeler
          </h3>
          <div className="flex items-center gap-2 font-mono text-[11px] text-text-muted">
            <span id={`servings-${cocktail.id}`}>Kaç kişilik?</span>
            <ServingsButton
              label="Bir kişi azalt"
              disabled={servings <= 1}
              onClick={() => setServings(servings - 1)}
            >
              <Minus className="h-3 w-3" />
            </ServingsButton>
            <output
              aria-labelledby={`servings-${cocktail.id}`}
              aria-live="polite"
              className="w-4 text-center text-sm text-text-primary"
            >
              {servings}
            </output>
            <ServingsButton
              label="Bir kişi artır"
              disabled={servings >= SERVINGS_MAX}
              onClick={() => setServings(servings + 1)}
            >
              <Plus className="h-3 w-3" />
            </ServingsButton>
          </div>
        </div>
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
              <VisualQuantity ingredient={{ ...ing, amount: scaleAmount(ing.amount, servings) }} />
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
      {cocktail.garnish && (
        <div className="mb-6 rounded bg-bg-elevated/50 px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            Süsleme:{" "}
          </span>
          <span className="prescription-text text-text-secondary">
            {cocktail.garnish}
          </span>
        </div>
      )}

      {/* Note */}
      {cocktail.note && (
        <div className="flex gap-3 border-t border-border pt-6">
          <Wine
            className="mt-0.5 h-4 w-4 shrink-0 text-crimson-glow/60"
            strokeWidth={1.5}
          />
          <p className="whitespace-pre-line font-mono text-xs italic leading-relaxed text-text-muted">
            {cocktail.note}
          </p>
        </div>
      )}
    </>
  );
}

function ServingsButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated text-text-secondary transition-colors hover:text-crimson-glow disabled:opacity-30 disabled:hover:text-text-secondary"
    >
      {children}
    </button>
  );
}
