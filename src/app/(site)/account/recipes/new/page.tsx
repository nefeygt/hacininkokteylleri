import type { Metadata } from "next";
import { loadSuggestions } from "@/app/admin/suggestions";
import { requireMember } from "@/lib/account";
import RecipeForm from "../RecipeForm";

export const metadata: Metadata = {
  title: "Yeni tarif",
  robots: { index: false },
};

export default async function NewRecipePage() {
  const { supabase, user } = await requireMember();
  const suggestions = await loadSuggestions(supabase);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Yeni tarif</div>
      <h1 className="mb-8 text-3xl font-bold">Yeni tarif</h1>
      <RecipeForm
        userId={user.id}
        suggestions={suggestions}
        initial={{
          name: "",
          subtitle: "",
          baseAlcohol: "",
          flavor: "",
          tags: [],
          color: "#8b1a1a",
          imagePath: null,
          ingredients: [{ name: "", amount: 4, unit: "cl", icon: "shot" }],
          instructions: [""],
          garnish: "",
          glass: "",
          vegan: false,
          note: "",
          isPublished: true,
        }}
      />
    </div>
  );
}
