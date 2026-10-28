"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Wine } from "lucide-react";
import type { Cocktail, Ingredient } from "@/lib/content";
import {
  SERVINGS_MAX,
  VOLUME_UNITS,
  VOLUME_UNIT_KEY,
  convertAmount,
  formatOunces,
  isConvertibleUnit,
  scaleAmount,
  type VolumeUnit,
} from "@/lib/recipe";
import VisualQuantity from "./VisualQuantity";
import { InstructionText } from "./Tooltip";
import { useLocale } from "./LocaleProvider";
import { unitLabel } from "@/lib/drink-log";

/**
 * The prescription itself: ingredients, steps, garnish and note. Shared by the
 * archive's card (house recipes) and a member's recipe page (M6), so one
 * recipe shape has one renderer (ADR-014). "Kaç kişilik?" scales the amounts
 * for up to SERVINGS_MAX glasses; the steps stay as written. "cl | oz" shows
 * volumes in ounces (1 oz = 3 cl) and is remembered in this browser.
 */
export default function RecipeDetails({ cocktail }: { cocktail: Cocktail }) {
  const { t } = useLocale();
  const tc = t.cocktails;
  const [servings, setServings] = useState(1);
  const [volumeUnit, setVolumeUnit] = useVolumeUnit();
  const hasVolumes = cocktail.ingredients.some((ing) => isConvertibleUnit(ing.unit));

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
            {tc.ingredients}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] text-text-muted">
            {hasVolumes && (
              <div role="group" aria-label={tc.volumeUnit} className="flex rounded-full bg-bg-elevated p-0.5">
                {VOLUME_UNITS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    aria-pressed={volumeUnit === unit}
                    onClick={() => setVolumeUnit(unit)}
                    className={`rounded-full px-2.5 py-0.5 transition-colors ${
                      volumeUnit === unit
                        ? "bg-crimson/20 text-crimson-glow"
                        : "text-text-secondary hover:text-crimson-glow"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span id={`servings-${cocktail.id}`}>{tc.servings}</span>
              <ServingsButton
                label={tc.servingsLess}
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
                label={tc.servingsMore}
                disabled={servings >= SERVINGS_MAX}
                onClick={() => setServings(servings + 1)}
              >
                <Plus className="h-3 w-3" />
              </ServingsButton>
            </div>
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
              <Quantity ingredient={ing} servings={servings} volumeUnit={volumeUnit} />
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-8">
        <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
          {tc.preparation}
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
            {tc.garnish}{" "}
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
          <p className="whitespace-pre-line text-sm italic leading-relaxed text-text-secondary">
            {cocktail.note}
          </p>
        </div>
      )}
    </>
  );
}

function Quantity({
  ingredient,
  servings,
  volumeUnit,
}: {
  ingredient: Ingredient;
  servings: number;
  volumeUnit: VolumeUnit;
}) {
  const { t } = useLocale();
  const shown = convertAmount(scaleAmount(ingredient.amount, servings), ingredient.unit, volumeUnit);
  // Ounces read "1½ oz"; other units are written in the page's language ("2 adet" → "2 pieces"), or as stored.
  const translated = unitLabel(shown.unit, shown.amount, t);
  const label =
    shown.unit !== ingredient.unit
      ? `${formatOunces(shown.amount)} oz`
      : translated !== shown.unit
        ? `${shown.amount} ${translated}`
        : undefined;
  return <VisualQuantity ingredient={{ ...ingredient, ...shown }} label={label} />;
}

/** The visitor's cl/oz choice, kept in localStorage; "cl" until it is read (and when storage is off). */
function useVolumeUnit(): [VolumeUnit, (unit: VolumeUnit) => void] {
  const [unit, setUnit] = useState<VolumeUnit>("cl");
  useEffect(() => {
    try {
      if (localStorage.getItem(VOLUME_UNIT_KEY) === "oz") setUnit("oz");
    } catch {}
  }, []);
  const choose = (next: VolumeUnit) => {
    setUnit(next);
    try {
      localStorage.setItem(VOLUME_UNIT_KEY, next);
    } catch {}
  };
  return [unit, choose];
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
