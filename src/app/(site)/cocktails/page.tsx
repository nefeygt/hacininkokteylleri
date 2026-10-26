import type { Metadata } from "next";
import CocktailBrowser from "@/components/CocktailBrowser";
import GlossaryProvider from "@/components/GlossaryProvider";
import { getGlossary, getPublishedCocktails } from "@/lib/content";

// Built once, then rebuilt at most hourly. An edit in the admin panel rebuilds
// it at once through revalidatePath (ADR-005).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kokteyller",
  description: "Hacı'nın kokteyl reçeteleri: baz içkiye, tada ve malzemeye göre ara, filtrele, tarifini aç.",
  alternates: { canonical: "/cocktails" },
};

export default async function KokteyllerPage() {
  const [cocktails, glossary] = await Promise.all([getPublishedCocktails(), getGlossary()]);

  return (
    <GlossaryProvider glossary={glossary}>
      <CocktailBrowser cocktails={cocktails} />
    </GlossaryProvider>
  );
}
