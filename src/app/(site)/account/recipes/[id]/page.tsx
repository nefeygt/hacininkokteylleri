import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadSuggestions } from "@/app/admin/suggestions";
import { requireMember } from "@/lib/account";
import RecipeForm from "../RecipeForm";

export const metadata: Metadata = {
  title: "Tarifi düzenle",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Edit or delete one of the member's own recipes. */
export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, user } = await requireMember();

  const [suggestions, { data: r }] = await Promise.all([
    loadSuggestions(supabase),
    supabase
      .from("cocktails")
      .select("*, cocktail_ingredients(position, name, amount, unit, icon)")
      .eq("id", id)
      .eq("author_id", user.id)
      .maybeSingle(),
  ]);
  if (!r) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Tarifi düzenle</div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">{r.name}</h1>
        {r.is_published && !r.hidden_at && (
          <Link href={`/recipes/${r.slug}`} className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary">
            Tarif sayfası →
          </Link>
        )}
      </div>
      {r.hidden_at && (
        <p className="mb-6 rounded border border-crimson/40 bg-crimson/10 p-3 font-mono text-xs text-text-secondary">
          Bu tarif bir yönetici tarafından gizlendi; yalnızca sen görüyorsun.
        </p>
      )}
      <RecipeForm
        id={r.id}
        slug={r.slug}
        userId={user.id}
        suggestions={suggestions}
        initial={{
          name: r.name,
          subtitle: r.subtitle,
          baseAlcohol: r.base_alcohol,
          flavor: r.flavor,
          tags: r.tags,
          color: r.color,
          imagePath: r.image_path,
          ingredients: [...r.cocktail_ingredients]
            .sort((a, b) => a.position - b.position)
            .map((i) => ({ name: i.name, amount: Number(i.amount), unit: i.unit, icon: i.icon })),
          instructions: r.instructions,
          garnish: r.garnish,
          glass: r.glass,
          vegan: r.vegan,
          note: r.note ?? "",
          isPublished: r.is_published,
        }}
      />
    </div>
  );
}
