import type { Metadata } from "next";
import WhatCanIMake from "@/components/WhatCanIMake";
import { getIngredientCatalogue, getPublishedCocktails } from "@/lib/content";

// Static like the archive; an edit in the panel rebuilds it at once (ADR-005).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Elimde ne var?",
  description: "Evdeki malzemeleri seç, Hacı'nın reçetelerinden yapabileceklerini gör.",
};

export default async function WhatCanIMakePage() {
  const [cocktails, catalogue] = await Promise.all([getPublishedCocktails(), getIngredientCatalogue()]);
  return <WhatCanIMake cocktails={cocktails} catalogue={catalogue} />;
}
