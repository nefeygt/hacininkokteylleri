// Landing pages per base spirit and flavour note (M9 package C): /cocktails/spirit/{slug} and
// /cocktails/flavor/{slug}, built from the same data as the archive's chips (ADR-026).
// Browser-safe, so the app could reuse it.

import { baseChoices, ALL, flavorChoices, flavorNotes, type Filterable } from "./archive-filter";

export type CollectionKind = "spirit" | "flavor";

/** A collection needs this many house recipes, so no page is thin. */
export const COLLECTION_MIN = 2;

/** "Tatlı" → "tatli", "Çiçeksi" → "ciceksi": Turkish letters folded for the URL. */
export function slugifyTr(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface Collection {
  kind: CollectionKind;
  slug: string;
  /** The value as the data writes it: "Votka", "Tatlı". */
  label: string;
  count: number;
}

function matches(kind: CollectionKind, label: string, c: Pick<Filterable, "baseAlcohol" | "flavor">): boolean {
  return kind === "spirit" ? c.baseAlcohol.trim() === label : flavorNotes(c.flavor).includes(label);
}

/** Every collection of a kind with enough recipes, most recipes first (the chips' order). */
export function collections<T extends Pick<Filterable, "baseAlcohol" | "flavor">>(
  kind: CollectionKind,
  cocktails: T[],
): Collection[] {
  const labels = (kind === "spirit" ? baseChoices(cocktails) : flavorChoices(cocktails)).filter((l) => l !== ALL);
  return labels
    .map((label) => ({ kind, label, slug: slugifyTr(label), count: cocktails.filter((c) => matches(kind, label, c)).length }))
    .filter((c) => c.count >= COLLECTION_MIN);
}

export function collectionCocktails<T extends Pick<Filterable, "baseAlcohol" | "flavor">>(
  collection: Collection,
  cocktails: T[],
): T[] {
  return cocktails.filter((c) => matches(collection.kind, collection.label, c));
}

export function collectionHref(c: Pick<Collection, "kind" | "slug">): string {
  return `/cocktails/${c.kind}/${c.slug}`;
}

/** The page's title: "Votka kokteylleri", "Tatlı kokteyller". */
export function collectionTitle(c: Pick<Collection, "kind" | "label">): string {
  return c.kind === "spirit" ? `${c.label} kokteylleri` : `${c.label} kokteyller`;
}

// A line of introduction per known value; a new value gets the generic one.
const INTROS: Record<CollectionKind, Record<string, string>> = {
  spirit: {
    Votka: "Votka kokteyle gövde verir ama kendini öne atmaz; meyveye, ekşiye ve otlara yer açar. Hacı'nın en kalabalık rafı.",
    Cin: "Ardıç, kabuk ve baharat: cin, tonikten sour'a kadar her reçeteye kendi bitki notalarını taşır.",
    Rom: "Şekerkamışından gelen yumuşak tatlılık; tropik meyveyle, nane ve limeyle en iyi hâlini bulur.",
    Viski: "Meşe, duman ve karamel. Viski kokteylleri ağır başlıdır; yavaş içilir.",
    Tekila: "Agavın topraksı keskinliği; lime ve tuzla ya da beklenmedik bir meyveyle buluşur.",
    Likör: "Tatlı, yoğun ve aromalı: likörler reçetenin yıldızı olduğunda kokteyl tatlıya yaklaşır.",
  },
  flavor: {
    Ekşi: "Limon ya da lime öne çıkar, şeker dengeler: ağzı toparlayan, iştah açan reçeteler.",
    Tatlı: "Şurup, likör ya da meyveyle yuvarlanmış, yumuşak içimli kokteyller.",
    Meyveli: "Taze meyve ya da meyve suyu taşıyan, renkli ve sulu reçeteler.",
    Ferah: "Buz gibi, hafif ve serinletici: sıcak bir akşamın kokteylleri.",
    Baharatlı: "Zencefil, tarçın ya da biber: dili hafifçe ısıtan reçeteler.",
    Kahve: "Espresso ya da kahve likörüyle: akşam yemeğinden sonrası için.",
  },
};

export function collectionIntro(c: Pick<Collection, "kind" | "label" | "count">): string {
  return (
    INTROS[c.kind][c.label] ??
    (c.kind === "spirit"
      ? `${c.label} bazlı ${c.count} reçete, Hacı'nın arşivinden.`
      : `Tadı ${c.label.toLocaleLowerCase("tr-TR")} olan ${c.count} reçete, Hacı'nın arşivinden.`)
  );
}

/**
 * "Günün kokteyli" (M9 package D): one house recipe per Turkish calendar day, the same for every visitor,
 * stepping through the archive in a scattered order; recipes with a photo first.
 */
export function cocktailOfTheDay<T extends { imageUrl?: string }>(cocktails: T[], day: string): T | null {
  const pool = cocktails.some((c) => c.imageUrl) ? cocktails.filter((c) => c.imageUrl) : cocktails;
  if (pool.length === 0) return null;
  const days = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  return pool[(days * 7919) % pool.length];
}
