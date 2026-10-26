import { requireAdmin } from "@/lib/admin";
import CocktailForm from "../../../CocktailForm";
import { loadSuggestions } from "../../../suggestions";
import { emptyNames, emptyTranslations } from "../../../translations";
import type { CocktailInput } from "../../../types";

export default async function NewCocktailPage() {
  const { supabase } = await requireAdmin();

  const [suggestions, { data: last }] = await Promise.all([
    loadSuggestions(supabase),
    supabase.from("cocktails").select("sort_order").order("sort_order", { ascending: false }).limit(1),
  ]);

  const initial: CocktailInput = {
    slug: "",
    name: "",
    subtitle: "",
    baseAlcohol: "",
    flavor: "",
    tags: [],
    color: "#c0392b",
    imagePath: null,
    ingredients: [{ name: "", amount: 4, unit: "cl", icon: "shot", ingredientId: "", translatedNames: emptyNames() }],
    instructions: [""],
    garnish: "",
    glass: "",
    vegan: true,
    note: "",
    sortOrder: (last?.[0]?.sort_order ?? 0) + 10,
    isPublished: true,
    translations: emptyTranslations(),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Yeni kokteyl</h1>
      <CocktailForm initial={initial} suggestions={suggestions} />
    </div>
  );
}
