"use client";

import Link from "@/components/LocaleLink";
import CocktailCard from "@/components/CocktailCard";
import { recipeHref, type Cocktail } from "@/lib/content";
import { collectionHref, collectionIntro, collectionTitle, type Collection } from "@/lib/collections";
import { format } from "@/lib/i18n/format";
import { useLocale } from "./LocaleProvider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

/** A spirit's or a flavour's landing page (M9 package C): intro, recipes, the other collections. */
export default function CollectionView({
  collection,
  cocktails,
  spirits,
  flavors,
}: {
  collection: Collection;
  cocktails: Cocktail[];
  spirits: Collection[];
  flavors: Collection[];
}) {
  const { t, locale } = useLocale();
  const tc = t.cocktails;
  const title = collectionTitle(collection, locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: cocktails.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${recipeHref(c.slug, false)}`,
      name: c.name,
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label={tc.breadcrumb} className="mb-6 font-mono text-[11px] text-text-muted">
        <Link href="/cocktails" className="hover:text-text-primary">
          {tc.title}
        </Link>
        <span className="mx-2">/</span>
        <span>{collection.kind === "spirit" ? tc.spiritCrumb : tc.flavorCrumb}</span>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">{collection.label}</span>
      </nav>

      <div className="mb-10 max-w-2xl">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">
          {format(tc.recipesCount, { n: collection.count })}
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{collectionIntro(collection, locale)}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cocktails.map((c) => (
          <CocktailCard key={c.id} cocktail={c} href={recipeHref(c.slug, false)} />
        ))}
      </div>

      <section className="mt-14 space-y-5 border-t border-border pt-8">
        <CollectionLinks heading={tc.bySpirit} items={spirits} current={collection} />
        <CollectionLinks heading={tc.byFlavor} items={flavors} current={collection} />
        <p className="text-xs text-text-muted">
          {tc.orPrefix}
          <Link href="/what-can-i-make" className="text-crimson-glow hover:underline">
            {tc.orLink}
          </Link>
        </p>
      </section>
    </div>
  );
}

export function CollectionLinks({
  heading,
  items,
  current,
}: {
  heading: string;
  items: Collection[];
  current?: Collection;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">{heading}</h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((c) => {
          const active = current?.kind === c.kind && current.slug === c.slug;
          return (
            <li key={c.slug}>
              <Link
                href={collectionHref(c)}
                aria-current={active ? "page" : undefined}
                className={`inline-block rounded border px-3 py-1.5 font-mono text-[11px] transition-colors ${
                  active
                    ? "border-crimson bg-crimson/15 text-crimson-glow"
                    : "border-border text-text-secondary hover:border-border-light hover:text-text-primary"
                }`}
              >
                {c.label} <span className="text-text-muted">{c.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
