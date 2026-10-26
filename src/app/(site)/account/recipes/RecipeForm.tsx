"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { fieldClass, labelClass } from "@/components/AccountCard";
import ImageField from "@/components/ImageField";
import type { IngredientIcon } from "@/lib/content";
import { unitChoices } from "@/lib/drink-log";
import { groupByCategory } from "@/lib/ingredients";
import { INGREDIENT_ICONS, RECIPE_LIMITS, type RecipeIngredient, type RecipeInput } from "@/lib/recipe";
import type { Suggestions } from "@/app/admin/types";
import { deleteRecipe, saveRecipe } from "./actions";
import GlassPicker from "@/components/GlassPicker";

const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded text-text-muted hover:bg-bg-elevated hover:text-text-primary disabled:opacity-30";

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border bg-bg-card p-5">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.15em] text-text-secondary">{title}</h2>
      {children}
    </section>
  );
}

/**
 * A member writes or edits their own recipe (M6). The same shape as a house
 * recipe (ADR-014), without the panel's ordering; the slug comes from the
 * name once, at creation.
 */
export default function RecipeForm({
  id,
  slug,
  userId,
  initial,
  suggestions,
}: {
  id?: string;
  slug?: string;
  userId: string;
  initial: RecipeInput;
  suggestions: Suggestions;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const L = RECIPE_LIMITS;
  const catalogueGroups = groupByCategory(suggestions.catalogue);
  const unlinked = form.ingredients.filter((ing) => !ing.ingredientId).length;

  function set<K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setIngredient(index: number, patch: Partial<RecipeIngredient>) {
    set("ingredients", form.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  }

  function setStep(index: number, text: string) {
    set("instructions", form.instructions.map((s, i) => (i === index ? text : s)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: RecipeInput = { ...form, tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean) };
    startTransition(async () => {
      const result = await saveRecipe(input, id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (input.isPublished && result.slug) {
        router.push(`/recipes/${result.slug}`);
      } else if (!id && result.id) {
        router.replace(`/account/recipes/${result.id}`);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!id) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteRecipe(id);
      if (result.error) {
        setError(result.error);
        setConfirmingDelete(false);
        return;
      }
      router.push("/account/recipes");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-24">
      <Section title="Tarif">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Ad</span>
            <input required maxLength={L.name} value={form.name} onChange={(e) => set("name", e.target.value)} className={fieldClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Kısa açıklama (isteğe bağlı)</span>
            <input
              maxLength={L.subtitle}
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Taze fesleğenli, hafif ekşi bir cin kokteyli"
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Baz alkol</span>
            <input
              required
              maxLength={L.baseAlcohol}
              list="base-alcohols"
              value={form.baseAlcohol}
              onChange={(e) => set("baseAlcohol", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Baskın tat</span>
            <input
              required
              maxLength={L.flavor}
              list="flavors"
              value={form.flavor}
              onChange={(e) => set("flavor", e.target.value)}
              className={fieldClass}
            />
          </label>
          <div className="col-span-full">
            <span className={labelClass}>Bardak</span>
            <GlassPicker value={form.glass} onChange={(v) => set("glass", v)} maxLength={L.glass} inputClassName={fieldClass} list="glasses" />
          </div>
          <label className="block">
            <span className={labelClass}>Vurgu rengi</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-border bg-bg-primary"
              />
              <input value={form.color} onChange={(e) => set("color", e.target.value)} className={fieldClass} />
            </div>
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Etiketler (virgülle ayır)</span>
            <input
              value={tagsText}
              onChange={(e) => {
                setTagsText(e.target.value);
                setSaved(false);
              }}
              placeholder="Ferah, Yaz, Bitkisel"
              className={fieldClass}
            />
          </label>
        </div>
      </Section>

      <Section title="Fotoğraf (isteğe bağlı)">
        <ImageField
          value={form.imagePath}
          slug={slug ?? "tarif"}
          folder={userId}
          onChange={(path) => set("imagePath", path)}
        />
      </Section>

      <Section title="Malzemeler">
        <p className="mb-4 text-xs text-text-muted">
          Her malzemenin yanında katalogdaki karşılığını seç. Bütün malzemeler eşleşirse tarifin{" "}
          <Link href="/what-can-i-make" className="text-text-secondary underline underline-offset-2 hover:text-text-primary">
            Elimde ne var?
          </Link>{" "}
          sayfasında da çıkar. Katalogda olmayan bir şey için &quot;Katalogda yok&quot; kalsın.
        </p>
        <div className="space-y-3">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded border border-border/60 p-3 sm:grid-cols-[1.5fr_1.3fr_80px_90px_140px_auto] sm:border-0 sm:p-0">
              <input
                required
                maxLength={L.ingredientName}
                placeholder="Malzeme"
                aria-label="Malzeme"
                value={ing.name}
                onChange={(e) => setIngredient(i, { name: e.target.value })}
                className={`${fieldClass} col-span-2 sm:col-span-1`}
              />
              {/* The catalogue item lets "Elimde ne var?" match the recipe (ADR-029); the name is what the recipe shows. */}
              <select
                aria-label="Katalogdaki karşılığı"
                value={ing.ingredientId ?? ""}
                onChange={(e) => {
                  const picked = suggestions.catalogue.find((c) => c.id === e.target.value);
                  setIngredient(i, {
                    ingredientId: e.target.value || undefined,
                    ...(picked && !ing.name.trim() ? { name: picked.name } : {}),
                  });
                }}
                className={`${fieldClass} col-span-2 sm:col-span-1 ${ing.ingredientId ? "" : "text-text-muted"}`}
              >
                <option value="">Katalogda yok</option>
                {catalogueGroups.map((g) => (
                  <optgroup key={g.value} label={g.label}>
                    {g.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                max={L.amount}
                placeholder="Miktar"
                aria-label="Miktar"
                value={Number.isNaN(ing.amount) ? "" : ing.amount}
                onChange={(e) => setIngredient(i, { amount: e.target.valueAsNumber })}
                className={fieldClass}
              />
              <select
                required
                value={ing.unit}
                aria-label="Birim"
                onChange={(e) => setIngredient(i, { unit: e.target.value })}
                className={fieldClass}
              >
                {unitChoices(ing.unit).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <select
                value={ing.icon}
                aria-label="Simge"
                onChange={(e) => setIngredient(i, { icon: e.target.value as IngredientIcon })}
                className={fieldClass}
              >
                {INGREDIENT_ICONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="col-span-2 flex justify-end sm:col-span-1">
                <button type="button" title="Yukarı" disabled={i === 0} onClick={() => set("ingredients", move(form.ingredients, i, i - 1))} className={iconButton}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" title="Aşağı" disabled={i === form.ingredients.length - 1} onClick={() => set("ingredients", move(form.ingredients, i, i + 1))} className={iconButton}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button type="button" title="Sil" disabled={form.ingredients.length === 1} onClick={() => set("ingredients", form.ingredients.filter((_, j) => j !== i))} className={`${iconButton} hover:text-crimson-glow`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {form.ingredients.length < L.ingredients && (
          <button
            type="button"
            onClick={() => set("ingredients", [...form.ingredients, { name: "", amount: 1, unit: "cl", icon: "shot" }])}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-crimson-glow"
          >
            <Plus className="h-3.5 w-3.5" /> Malzeme ekle
          </button>
        )}
        <p className={`mt-3 text-[11px] ${unlinked === 0 ? "text-vegan" : "text-text-muted"}`}>
          {unlinked === 0
            ? "Bütün malzemeler katalogla eşleşti: yayındayken Elimde ne var?'da görünür."
            : `${unlinked} malzeme katalogla eşleşmedi; tarif Elimde ne var?'da görünmez.`}
        </p>
      </Section>

      <Section title="Hazırlanışı">
        <div className="space-y-2">
          {form.instructions.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crimson/15 font-mono text-[10px] text-crimson-glow">
                {i + 1}
              </span>
              <textarea
                rows={2}
                maxLength={L.step}
                aria-label={`${i + 1}. adım`}
                value={step}
                onChange={(e) => setStep(i, e.target.value)}
                className={`${fieldClass} resize-y`}
              />
              <div className="flex flex-col">
                <button type="button" title="Yukarı" disabled={i === 0} onClick={() => set("instructions", move(form.instructions, i, i - 1))} className={iconButton}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" title="Sil" disabled={form.instructions.length === 1} onClick={() => set("instructions", form.instructions.filter((_, j) => j !== i))} className={`${iconButton} hover:text-crimson-glow`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {form.instructions.length < L.instructions && (
          <button
            type="button"
            onClick={() => set("instructions", [...form.instructions, ""])}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-crimson-glow"
          >
            <Plus className="h-3.5 w-3.5" /> Adım ekle
          </button>
        )}
      </Section>

      <Section title="Ayrıntılar">
        <div className="grid gap-4">
          <label className="block">
            <span className={labelClass}>Süsleme (isteğe bağlı)</span>
            <input maxLength={L.garnish} value={form.garnish} onChange={(e) => set("garnish", e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Not (isteğe bağlı)</span>
            <textarea rows={3} maxLength={L.note} value={form.note} onChange={(e) => set("note", e.target.value)} className={`${fieldClass} resize-y`} />
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={form.vegan} onChange={(e) => set("vegan", e.target.checked)} className="accent-crimson-glow" />
            Vegan
          </label>
          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => set("isPublished", e.target.checked)}
              className="mt-1 accent-crimson-glow"
            />
            <span>
              Yayında
              <span className="block text-[11px] text-text-muted">
                Yayındaki tarifler profilinde ve akışta herkese görünür. İşaretli değilse taslak olarak yalnızca sende kalır.
              </span>
            </span>
          </label>
        </div>
      </Section>

      {id && (
        <Section title="Tarifi sil">
          <p className="mb-3 text-xs text-text-muted">
            Tarif, fotoğrafı ve ona yazılan değerlendirmeler kalıcı olarak silinir. Günlük kayıtları kendi kopyalarını korur.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={remove}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs ${
                confirmingDelete ? "bg-crimson text-white hover:bg-crimson-light" : "border border-crimson/50 text-crimson-glow hover:bg-crimson/10"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" /> {confirmingDelete ? "Emin misin? Evet, sil" : "Tarifi sil"}
            </button>
            {confirmingDelete && (
              <button type="button" onClick={() => setConfirmingDelete(false)} className="text-xs text-text-muted hover:text-text-primary">
                Vazgeç
              </button>
            )}
          </div>
        </Section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-primary/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 text-xs">
            {error ? (
              <span className="text-crimson-glow">{error}</span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1.5 text-vegan">
                <Check className="h-3.5 w-3.5" /> Kaydedildi.
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/account/recipes" className="rounded px-3 py-2 text-xs text-text-muted hover:text-text-primary">
              Tariflerim
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded bg-crimson px-5 py-2 text-sm font-medium text-white hover:bg-crimson-light disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {id ? "Kaydet" : form.isPublished ? "Yayınla" : "Taslak olarak kaydet"}
            </button>
          </div>
        </div>
      </div>

      <datalist id="base-alcohols">{suggestions.baseAlcohols.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="flavors">{suggestions.flavors.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="glasses">{suggestions.glasses.map((v) => <option key={v} value={v} />)}</datalist>
    </form>
  );
}
