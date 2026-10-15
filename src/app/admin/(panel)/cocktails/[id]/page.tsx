import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import CocktailForm from "../../../CocktailForm";
import { loadSuggestions } from "../../../suggestions";
import type { CocktailInput } from "../../../types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditCocktailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const [suggestions, { data: c }] = await Promise.all([
    loadSuggestions(supabase),
    supabase
      .from("cocktails")
      .select("*, cocktail_ingredients(position, name, amount, unit, icon, ingredient_id)")
      .eq("id", id)
      .is("author_id", null)
      .maybeSingle(),
  ]);
  if (!c) notFound();

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
      .map((i) => ({
        name: i.name,
        amount: Number(i.amount),
        unit: i.unit,
        icon: i.icon,
        ingredientId: i.ingredient_id ?? "",
      })),
    instructions: c.instructions,
    garnish: c.garnish,
    glass: c.glass,
    vegan: c.vegan,
    note: c.note ?? "",
    sortOrder: c.sort_order,
    isPublished: c.is_published,
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{c.name}</h1>
      <CocktailForm initial={initial} suggestions={suggestions} />
    </div>
  );
}
