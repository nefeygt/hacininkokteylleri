"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Lock, Pencil, Plus, X } from "lucide-react";
import { fieldClass, labelClass, primaryButtonClass } from "@/components/AccountCard";
import Stars from "@/components/Stars";
import { LOG_LIMITS, LOG_NOTE_MAX_LENGTH, unitChoices, unitLabel, type LogRecipe } from "@/lib/drink-log";
import type { IngredientIcon } from "@/lib/content";
import { useLocale } from "@/components/LocaleProvider";
import { deleteDrinkLog, saveDrinkLog } from "./actions";
import GlassPicker from "@/components/GlassPicker";

interface IngredientRow {
  key: number;
  name: string;
  amount: string; // as typed; "1,5" works too
  unit: string;
  icon: IngredientIcon;
}

export interface LogFormValues {
  cocktailId: string;
  drunkOn: string;
  recipe: LogRecipe;
  rating: number | null;
  note: string;
  isPublic: boolean;
}

let nextKey = 0;
const rowFrom = (i: LogRecipe["ingredients"][number]): IngredientRow => ({
  key: nextKey++,
  name: i.name,
  amount: String(i.amount).replace(".", ","),
  unit: i.unit,
  icon: i.icon,
});

const smallField =
  "rounded border border-border bg-bg-primary px-2.5 py-2 text-sm text-text-primary outline-none transition-colors focus:border-crimson-glow/50";

/**
 * A drink log: starts from the recipe and lets the member change it to what
 * they actually made ("gin instead of vodka"). The snapshot is saved with the
 * log (ADR-014). `id` set = editing an existing log.
 */
export default function LogForm({ initial, id, today }: { initial: LogFormValues; id?: string; today: string }) {
  const router = useRouter();
  const { t, href } = useLocale();
  const tf = t.logForm;
  const [drunkOn, setDrunkOn] = useState(initial.drunkOn);
  const [rows, setRows] = useState<IngredientRow[]>(() => initial.recipe.ingredients.map(rowFrom));
  const originalSteps = initial.recipe.instructions.join("\n");
  const [steps, setSteps] = useState(originalSteps);
  // The steps stay as they were unless the member asks to change them.
  const [editingSteps, setEditingSteps] = useState(false);
  const stepLines = steps.split("\n").filter((line) => line.trim());
  const [garnish, setGarnish] = useState(initial.recipe.garnish ?? "");
  const [glass, setGlass] = useState(initial.recipe.glass ?? "");
  const [rating, setRating] = useState<number | null>(initial.rating);
  const [note, setNote] = useState(initial.note);
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function setRow(key: number, patch: Partial<IngredientRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function save() {
    setError(null);
    const recipe = {
      name: initial.recipe.name,
      ingredients: rows.map((r) => ({
        name: r.name,
        amount: r.amount.trim() ? Number(r.amount.replace(",", ".")) : NaN,
        unit: r.unit,
        icon: r.icon,
      })),
      instructions: steps.split("\n"),
      garnish,
      glass,
    };
    startTransition(async () => {
      const result = await saveDrinkLog(
        { cocktailId: initial.cocktailId, drunkOn, recipe, rating, note, isPublic },
        id
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(href("/account/logs"));
      router.refresh();
    });
  }

  function remove() {
    if (!id) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteDrinkLog(id);
      if (result.error) {
        setError(result.error);
        setConfirmingDelete(false);
        return;
      }
      router.push(href("/account/logs"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className={labelClass}>{tf.date}</span>
        <input
          type="date"
          value={drunkOn}
          max={today}
          min="2000-01-01"
          required
          onChange={(e) => setDrunkOn(e.target.value)}
          className={fieldClass}
        />
      </label>

      <fieldset>
        <legend className={labelClass}>{tf.ingredientsLegend}</legend>
        <p className="mb-3 font-mono text-[11px] leading-relaxed text-text-muted">
          {tf.ingredientsHint}
        </p>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                value={row.name}
                onChange={(e) => setRow(row.key, { name: e.target.value })}
                maxLength={LOG_LIMITS.ingredientName}
                placeholder={tf.ingredient}
                aria-label={tf.ingredient}
                className={`${smallField} min-w-0 flex-1`}
              />
              <input
                value={row.amount}
                onChange={(e) => setRow(row.key, { amount: e.target.value })}
                inputMode="decimal"
                placeholder="4"
                aria-label={tf.amount}
                className={`${smallField} w-16 shrink-0 text-right`}
              />
              <select
                value={row.unit}
                onChange={(e) => setRow(row.key, { unit: e.target.value })}
                aria-label={tf.unit}
                className={`${smallField} w-28 shrink-0`}
              >
                {unitChoices(row.unit).map((unit) => (
                  <option key={unit} value={unit}>
                    {unitLabel(unit, 1, t)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                title={tf.removeIngredient}
                aria-label={tf.removeIngredient}
                disabled={rows.length === 1}
                onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-text-muted hover:text-crimson-glow disabled:opacity-30"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {rows.length < LOG_LIMITS.ingredients && (
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, { key: nextKey++, name: "", amount: "", unit: "cl", icon: "shot" }])}
            className="mt-3 flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            {tf.addIngredient}
          </button>
        )}
      </fieldset>

      <div>
        <div className="flex items-center justify-between">
          <span className={labelClass}>{tf.preparation}</span>
          <button
            type="button"
            onClick={() => {
              if (editingSteps) setSteps(originalSteps);
              setEditingSteps(!editingSteps);
            }}
            className="flex items-center gap-1 font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary"
          >
            {!editingSteps && <Pencil className="h-3 w-3" />}
            {editingSteps ? tf.backToOriginal : tf.change}
          </button>
        </div>
        {editingSteps ? (
          <>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={4}
              autoFocus
              aria-label={tf.stepsLabel}
              className={`${fieldClass} resize-y`}
            />
            <p className="mt-1.5 font-mono text-[11px] text-text-muted">{tf.stepsHint}</p>
          </>
        ) : (
          <div className="relative rounded border border-dashed border-border bg-bg-elevated/30 py-2.5 pl-3 pr-8">
            <Lock className="absolute right-3 top-3 h-3 w-3 text-text-muted" aria-hidden />
            {stepLines.length ? (
              <ol className="space-y-1 text-sm text-text-muted">
                {stepLines.map((line, i) => (
                  <li key={i}>
                    {i + 1}. {line.trim()}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="font-mono text-[11px] text-text-muted">{tf.noSteps}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{tf.garnish}</span>
          <input value={garnish} onChange={(e) => setGarnish(e.target.value)} maxLength={LOG_LIMITS.garnish} className={fieldClass} />
        </label>
      </div>

      <div>
        <span className={labelClass}>{tf.glass}</span>
        <GlassPicker value={glass} onChange={setGlass} maxLength={LOG_LIMITS.glass} inputClassName={fieldClass} />
      </div>

      <div>
        <span className={labelClass}>{tf.eveningRating}</span>
        <div className="flex items-center gap-3">
          <Stars value={rating ?? 0} size={26} onChange={setRating} />
          {rating !== null && (
            <button
              type="button"
              onClick={() => setRating(null)}
              className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary"
            >
              {tf.removeRating}
            </button>
          )}
        </div>
        <p className="mt-1.5 font-mono text-[11px] text-text-muted">
          {tf.ratingHint}
        </p>
      </div>

      <label className="block">
        <span className={labelClass}>{tf.note}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={LOG_NOTE_MAX_LENGTH}
          rows={3}
          placeholder={tf.notePlaceholder}
          className={`${fieldClass} resize-y`}
        />
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-crimson"
        />
        <span className="text-xs leading-relaxed text-text-secondary">
          {tf.publicCheck}
        </span>
      </label>

      {error && <p className="text-xs text-crimson-glow">{error}</p>}

      <div className="space-y-3">
        <button type="button" onClick={save} disabled={pending} className={primaryButtonClass}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {id ? tf.update : tf.add}
        </button>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={pending}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            {t.common.cancel}
          </button>
          {id && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className={`text-xs underline underline-offset-2 hover:text-crimson-glow ${
                confirmingDelete ? "text-crimson-glow" : "text-text-muted"
              }`}
            >
              {confirmingDelete ? t.common.confirmDelete : tf.deleteEntry}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
