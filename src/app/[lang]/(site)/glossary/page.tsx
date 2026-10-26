import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { getGlossary, getPublishedCocktails, recipeHref, type Cocktail } from "@/lib/content";
import { slugifyTr } from "@/lib/collections";
import { OPEN_GRAPH_BASE } from "@/lib/seo";

// Static, rebuilt hourly (ADR-005); the panel's glossary editor revalidates it at once.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Kokteyl sözlüğü",
  description: "Reçetelerde geçen bar terimleri: top up, şeker şurubu, aquafaba ve dahası; ne demek, hangi kokteylde geçiyor.",
  alternates: { canonical: "/glossary" },
  openGraph: { ...OPEN_GRAPH_BASE, url: "/glossary" },
};

/** The recipes whose lines or steps use a term, as the recipe cards' tooltips find it. */
function usedIn(term: string, cocktails: Cocktail[]): Cocktail[] {
  const needle = term.toLocaleLowerCase("tr-TR");
  return cocktails.filter((c) =>
    [...c.instructions, ...c.ingredients.map((i) => i.name), c.garnish, c.note ?? ""].some((text) =>
      text.toLocaleLowerCase("tr-TR").includes(needle),
    ),
  );
}

/** The glossary (M9 package C): every term the recipe cards underline, with the recipes that use it. */
export default async function GlossaryPage() {
  const [glossary, cocktails] = await Promise.all([getGlossary(), getPublishedCocktails()]);
  const terms = Object.entries(glossary).sort(([a], [b]) => a.localeCompare(b, "tr"));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "haci kokteyl sözlüğü",
    hasDefinedTerm: terms.map(([term, definition]) => ({ "@type": "DefinedTerm", name: term, description: definition })),
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Sözlük</div>
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Kokteyl sözlüğü</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        Reçetelerde altı çizili gördüğün bar terimleri ve geçtikleri tarifler.
      </p>

      <dl className="mt-10 space-y-8">
        {terms.map(([term, definition]) => {
          const recipes = usedIn(term, cocktails);
          return (
            <div key={term} id={slugifyTr(term)} className="scroll-mt-24 border-t border-border pt-6">
              <dt className="text-xl font-semibold text-text-primary">{term}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-text-secondary">{definition}</dd>
              {recipes.length > 0 && (
                <dd className="mt-3 text-xs text-text-muted">
                  <span className="font-mono uppercase tracking-[0.15em]">Geçtiği tarifler: </span>
                  {recipes.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ", "}
                      <Link href={recipeHref(c.slug, false)} className="text-crimson-glow hover:underline">
                        {c.name}
                      </Link>
                    </span>
                  ))}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
