import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import CollectionView from "@/components/CollectionView";
import { getPublishedCocktails } from "@/lib/content";
import {
  collectionCocktails,
  collectionHref,
  collectionIntro,
  collections,
  collectionTitle,
  type CollectionKind,
} from "@/lib/collections";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { format } from "@/lib/i18n/format";
import { asLocale, localePath, type Locale } from "@/lib/i18n/locales";
import { alternatesFor, openGraphBase } from "@/lib/seo";

// Static, rebuilt hourly like the archive (ADR-005); a panel save revalidates it at once.
export const revalidate = 3600;

const KIND: CollectionKind = "flavor";
const loadArchive = cache(getPublishedCocktails);

type Params = Promise<{ lang: string; slug: string }>;

async function load(slug: string, lang: Locale) {
  const archive = await loadArchive(lang);
  const spirits = collections("spirit", archive);
  const flavors = collections("flavor", archive);
  const collection = (KIND === "spirit" ? spirits : flavors).find((c) => c.slug === slug);
  return collection ? { collection, cocktails: collectionCocktails(collection, archive), spirits, flavors } : null;
}

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  return collections(KIND, await loadArchive(asLocale(params.lang))).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  const lang = asLocale(rawLang);
  const t = getDictionary(lang);
  const found = await load(slug, lang);
  if (!found) return { title: t.status.notFoundMeta };
  const title = collectionTitle(found.collection, lang);
  const path = collectionHref(found.collection);
  return {
    title,
    description: `${collectionIntro(found.collection, lang)} ${format(t.pageMeta.collectionSuffix, { n: found.collection.count })}`,
    alternates: alternatesFor(lang, path),
    openGraph: { ...openGraphBase(lang), url: localePath(lang, path) },
  };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { lang, slug } = await params;
  const found = await load(slug, asLocale(lang));
  if (!found) notFound();
  return <CollectionView {...found} />;
}
