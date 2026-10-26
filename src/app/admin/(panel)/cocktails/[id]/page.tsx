import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import CocktailForm from "../../../CocktailForm";
import { loadSuggestions } from "../../../suggestions";
import { emptyNames, emptyTranslations, TRANSLATED_LOCALES, type TranslatedLocale } from "../../../translations";
import type { CocktailInput } from "../../../types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const [suggestions, { data: c }, { data: rows, error: rowsError }] = await Promise.all([
    loadSuggestions(supabase),
    supabase
      .from("cocktails")
      .select("*, cocktail_ingredients(position, name, amount, unit, icon, ingredient_id)")
      .eq("id", id)
      .is("author_id", null)
      .maybeSingle(),
    supabase
      .from("cocktail_translations")
      .select("locale, name, subtitle, base_alcohol, flavor, tags, garnish, glass, note, instructions, ingredient_names")
      .eq("cocktail_id", id),
  ]);
  if (!c) notFound();
  if (rowsError) throw new Error(rowsError.message);

  const translations = emptyTranslations();
  const byLocale = new Map(rows.map((r) => [r.locale, r]));
  for (const locale of TRANSLATED_LOCALES) {
    const r = byLocale.get(locale);
    if (!r) continue;
    translations[locale] = {
      name: r.name ?? "",
      subtitle: r.subtitle,
      baseAlcohol: r.base_alcohol,
      flavor: r.flavor,
      tags: r.tags,
      garnish: r.garnish,
      glass: r.glass,
      note: r.note ?? "",
      instructions: r.instructions,
    };
  }
  /** A line's names in other languages, by its position (ingredient_names starts at the first line). */
  const namesAt = (index: number) => {
    const names = emptyNames();
    for (const locale of TRANSLATED_LOCALES) names[locale as TranslatedLocale] = byLocale.get(locale)?.ingredient_names[index] ?? "";
    return names;
  };

  const initial: CocktailInput = {
    id: c.id,
    slug: c.slug,
    name: c.name,
    subtitle: c.subtitle,
    baseAlcohol: c.base_alcohol,
    flavor: c.flavor,
    tags: c.tags,
    color: c.color,
    imagePath: c.image_path,
    ingredients: [...c.cocktail_ingredients]
      .sort((a, b) => a.position - b.position)
      .map((i, index) => ({
        name: i.name,
        amount: Number(i.amount),
        unit: i.unit,
        icon: i.icon,
        ingredientId: i.ingredient_id ?? "",
        translatedNames: namesAt(index),
      })),
    instructions: c.instructions,
    garnish: c.garnish,
    glass: c.glass,
    vegan: c.vegan,
    note: c.note ?? "",
    sortOrder: c.sort_order,
    isPublished: c.is_published,
    translations,
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{c.name}</h1>
      <CocktailForm initial={initial} suggestions={suggestions} />
    </div>
  );
}
