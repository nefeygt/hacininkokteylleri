"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Trash2 } from "lucide-react";
import type { IngredientIcon } from "@/lib/content";
import { slugify } from "@/lib/slug";
import { deleteCocktail, saveCocktail } from "./actions";
import ImageField from "@/components/ImageField";
import type { CocktailInput, IngredientInput, Suggestions } from "./types";

// What each icon means on the recipe card (VisualQuantity draws one per unit).
const ICONS: { value: IngredientIcon; label: string }[] = [
  { value: "shot", label: "Shot / ölçü" },
  { value: "spoon", label: "Şurup / kaşık" },
  { value: "dash", label: "Az (dash)" },
  { value: "drop", label: "Damla / adet" },
  { value: "slice", label: "Dilim / yaprak" },
  { value: "topup", label: "Tamamla (top up)" },
];

const label = "mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted";
const field =
  "w-full rounded border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary outline-none transition-colors focus:border-crimson-glow/50";
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

export default function CocktailForm({
  initial,
  suggestions,
}: {
  initial: CocktailInput;
  suggestions: Suggestions;
}) {
  const router = useRouter();
  const isNew = !initial.id;
  const [form, setForm] = useState(initial);
  const [tagsText, setTagsText] = useState(initial.tags.join(", "));
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof CocktailInput>(key: K, value: CocktailInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function setIngredient(index: number, patch: Partial<IngredientInput>) {
    set("ingredients", form.ingredients.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)));
  }

  function setStep(index: number, text: string) {
    set("instructions", form.instructions.map((s, i) => (i === index ? text : s)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CocktailInput = {
      ...form,
      tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    };
    startTransition(async () => {
      const result = await saveCocktail(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (isNew && result.id) {
        router.replace(`/cocktails/${result.id}`);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  function remove() {
    if (!form.id) return;
    const id = form.id;
    startTransition(async () => {
      const result = await deleteCocktail(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 pb-24">
      <Section title="Kimlik">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Ad</span>
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugEdited ? f.slug : slugify(name) }));
                setSaved(false);
              }}
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Kısa ad (adres ve dosya adı)</span>
            <input
              required
              value={form.slug}
              onChange={(e) => {
                setSlugEdited(true);
                set("slug", e.target.value.toLowerCase());
              }}
              className={field}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Alt başlık</span>
            <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className={label}>Baz alkol</span>
            <input
              required
              list="base-alcohols"
              value={form.baseAlcohol}
              onChange={(e) => set("baseAlcohol", e.target.value)}
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Baskın tat</span>
            <input
              required
              list="flavors"
              value={form.flavor}
              onChange={(e) => set("flavor", e.target.value)}
              className={field}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Etiketler (virgülle ayır)</span>
            <input
              value={tagsText}
              onChange={(e) => {
                setTagsText(e.target.value);
                setSaved(false);
              }}
              placeholder="Votka, Ferah, Klasik"
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Vurgu rengi</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-9 w-12 shrink-0 cursor-pointer rounded border border-border bg-bg-primary"
              />
              <input value={form.color} onChange={(e) => set("color", e.target.value)} className={field} />
            </div>
          </label>
          <label className="block">
            <span className={label}>Bardak</span>
            <input list="glasses" value={form.glass} onChange={(e) => set("glass", e.target.value)} className={field} />
          </label>
        </div>
      </Section>

      <Section title="Fotoğraf">
        <ImageField value={form.imagePath} slug={form.slug} onChange={(path) => set("imagePath", path)} />
      </Section>

      <Section title="Malzemeler">
        <div className="space-y-3">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded border border-border/60 p-3 sm:grid-cols-[2fr_90px_100px_160px_auto] sm:border-0 sm:p-0">
              <input
                required
                placeholder="Malzeme"
                value={ing.name}
                onChange={(e) => setIngredient(i, { name: e.target.value })}
                className={`${field} col-span-2 sm:col-span-1`}
              />
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Miktar"
                value={Number.isNaN(ing.amount) ? "" : ing.amount}
                onChange={(e) => setIngredient(i, { amount: e.target.valueAsNumber })}
                className={field}
              />
              <input
                required
                list="units"
                placeholder="Birim"
                value={ing.unit}
                onChange={(e) => setIngredient(i, { unit: e.target.value })}
                className={field}
              />
              <select
                value={ing.icon}
                onChange={(e) => setIngredient(i, { icon: e.target.value as IngredientIcon })}
                className={field}
              >
                {ICONS.map((o) => (
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
        <button
          type="button"
          onClick={() => set("ingredients", [...form.ingredients, { name: "", amount: 1, unit: "cl", icon: "shot" }])}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-crimson-glow"
        >
          <Plus className="h-3.5 w-3.5" /> Malzeme ekle
        </button>
      </Section>

      <Section title="Hazırlanışı">
        <div className="space-y-2">
          {form.instructions.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-crimson/15 font-mono text-[10px] text-crimson-glow">
                {i + 1}
              </span>
              <textarea
                rows={2}
                value={step}
                onChange={(e) => setStep(i, e.target.value)}
                className={`${field} resize-y`}
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
        <button
          type="button"
          onClick={() => set("instructions", [...form.instructions, ""])}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-crimson-glow"
        >
          <Plus className="h-3.5 w-3.5" /> Adım ekle
        </button>
        <p className="mt-3 font-mono text-[11px] text-text-muted">
          Sözlükteki terimler (ör. &quot;Top up&quot;, &quot;Şeker Şurubu&quot;) sitede otomatik olarak açıklamalı gösterilir.
        </p>
      </Section>

      <Section title="Ayrıntılar">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Süsleme</span>
            <input value={form.garnish} onChange={(e) => set("garnish", e.target.value)} className={field} />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Not</span>
            <textarea rows={3} value={form.note} onChange={(e) => set("note", e.target.value)} className={`${field} resize-y`} />
          </label>
          <label className="block">
            <span className={label}>Sıra (küçük olan önce)</span>
            <input
              type="number"
              step="1"
              value={Number.isNaN(form.sortOrder) ? "" : form.sortOrder}
              onChange={(e) => set("sortOrder", e.target.valueAsNumber)}
              className={field}
            />
          </label>
          <div className="flex flex-col justify-end gap-3 pb-1">
            <label className="flex items-center gap-2 font-mono text-sm text-text-secondary">
              <input type="checkbox" checked={form.vegan} onChange={(e) => set("vegan", e.target.checked)} className="accent-crimson-glow" />
              Vegan
            </label>
            <label className="flex items-center gap-2 font-mono text-sm text-text-secondary">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="accent-crimson-glow" />
              Sitede yayında
            </label>
          </div>
        </div>
      </Section>

      {!isNew && (
        <Section title="Tehlikeli bölge">
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs text-text-secondary">
                Kokteyl ve fotoğrafı kalıcı olarak silinecek.
              </span>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded border border-border px-3 py-1.5 font-mono text-xs text-text-secondary hover:text-text-primary">
                Vazgeç
              </button>
              <button type="button" disabled={pending} onClick={remove} className="rounded bg-crimson px-3 py-1.5 font-mono text-xs text-white hover:bg-crimson-light disabled:opacity-60">
                Evet, sil
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-crimson-glow">
              <Trash2 className="h-3.5 w-3.5" /> Kokteyli sil
            </button>
          )}
        </Section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-primary/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 font-mono text-xs">
            {error ? (
              <span className="text-crimson-glow">{error}</span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1.5 text-green-400">
                <Check className="h-3.5 w-3.5" /> Kaydedildi, sitede güncel.
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/" className="rounded px-3 py-2 font-mono text-xs text-text-muted hover:text-text-primary">
              Listeye dön
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded bg-crimson px-5 py-2 font-mono text-sm font-medium text-white hover:bg-crimson-light disabled:opacity-60"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isNew ? "Oluştur" : "Kaydet"}
            </button>
          </div>
        </div>
      </div>

      <datalist id="base-alcohols">{suggestions.baseAlcohols.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="flavors">{suggestions.flavors.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="glasses">{suggestions.glasses.map((v) => <option key={v} value={v} />)}</datalist>
      <datalist id="units">{suggestions.units.map((v) => <option key={v} value={v} />)}</datalist>
    </form>
  );
}
