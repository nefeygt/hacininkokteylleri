import { requireAdmin } from "@/lib/admin";
import IngredientCatalogueEditor from "../../IngredientCatalogueEditor";

export default async function IngredientsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: items, error }, { data: uses, error: usesError }] = await Promise.all([
    supabase.from("ingredients").select("id, name, category, always_at_hand").order("name"),
    supabase.from("cocktail_ingredients").select("ingredient_id").not("ingredient_id", "is", null),
  ]);
  if (error) throw new Error(error.message);
  if (usesError) throw new Error(usesError.message);

  const useCount = new Map<string, number>();
  for (const u of uses) useCount.set(u.ingredient_id!, (useCount.get(u.ingredient_id!) ?? 0) + 1);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Malzemeler</h1>
      <p className="mb-6 mt-1 max-w-xl text-xs leading-relaxed text-text-muted">
        Tariflerdeki her malzeme bu katalogdan birine bağlanır; sitedeki &quot;Elimde ne var?&quot; sayfası ziyaretçinin
        seçtiklerini bu bağlantılarla eşleştirir. &quot;Hep elde&quot; işaretli olanlar (su gibi) seçilmeden var sayılır.
        Tariflerde kullanılan bir malzeme silinemez.
      </p>
      <IngredientCatalogueEditor
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          alwaysAtHand: i.always_at_hand,
          uses: useCount.get(i.id) ?? 0,
        }))}
      />
    </div>
  );
}
