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
import { OPEN_GRAPH_BASE } from "@/lib/seo";

// Static, rebuilt hourly like the archive (ADR-005); a panel save revalidates it at once.
export const revalidate = 3600;

const KIND: CollectionKind = "flavor";
const loadArchive = cache(getPublishedCocktails);

async function load(slug: string) {
  const archive = await loadArchive();
  const spirits = collections("spirit", archive);
  const flavors = collections("flavor", archive);
  const collection = (KIND === "spirit" ? spirits : flavors).find((c) => c.slug === slug);
  return collection ? { collection, cocktails: collectionCocktails(collection, archive), spirits, flavors } : null;
}

export async function generateStaticParams() {
  return collections(KIND, await loadArchive()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const found = await load((await params).slug);
  if (!found) return { title: "Bulunamadı" };
  const title = collectionTitle(found.collection);
  const path = collectionHref(found.collection);
  return {
    title,
    description: `${collectionIntro(found.collection)} ${found.collection.count} tarif, malzemeleri ve yapılışıyla.`,
    alternates: { canonical: path },
    openGraph: { ...OPEN_GRAPH_BASE, url: path },
  };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await load((await params).slug);
  if (!found) notFound();
  return <CollectionView {...found} />;
}
