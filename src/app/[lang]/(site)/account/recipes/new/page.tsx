import type { Metadata } from "next";
import { loadSuggestions } from "@/app/admin/suggestions";
import { requireMember } from "@/lib/account";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale } from "@/lib/i18n/locales";
import RecipeForm from "../RecipeForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).lang)).recipesPage;
  return { title: t.newMeta, robots: { index: false } };
}

export default async function NewRecipePage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = asLocale((await params).lang);
  const t = getDictionary(lang).recipesPage;
  const { supabase, user } = await requireMember(lang);
  const suggestions = await loadSuggestions(supabase, lang);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">{t.newEyebrow}</div>
      <h1 className="mb-8 text-3xl font-bold">{t.newMeta}</h1>
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
