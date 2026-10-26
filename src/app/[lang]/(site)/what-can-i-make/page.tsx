import type { Metadata } from "next";
import WhatCanIMake from "@/components/WhatCanIMake";
import { getIngredientCatalogue, getMatchableRecipes, getPublishedCocktails } from "@/lib/content";

// Static like the archive; an edit in the panel or a member's recipe save rebuilds it at once (ADR-005).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Elimde ne var?",
  description: "Evdeki malzemeleri seç, Hacı'nın reçetelerinden ve üyelerin tariflerinden yapabileceklerini gör.",
};

export default async function WhatCanIMakePage() {
  // House recipes first, then members' fully linked ones (ADR-029).
  const [house, members, catalogue] = await Promise.all([
    getPublishedCocktails(),
    getMatchableRecipes(),
    getIngredientCatalogue(),
  ]);
  return <WhatCanIMake cocktails={[...house, ...members]} catalogue={catalogue} />;
}
