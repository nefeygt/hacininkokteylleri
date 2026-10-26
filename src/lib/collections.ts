// Landing pages per base spirit and flavour note (M9 package C): /cocktails/spirit/{slug} and
// /cocktails/flavor/{slug}, built from the same data as the archive's chips (ADR-026).
// Browser-safe, so the app could reuse it.

import { baseChoices, ALL, flavorChoices, flavorNotes, type Filterable } from "./archive-filter";
import { getDictionary } from "./i18n/dictionaries";
import { format } from "./i18n/format";
import { DEFAULT_LOCALE, INTL_LOCALES, type Locale } from "./i18n/locales";

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

/** The page's title: "Votka kokteylleri", "Tatlı kokteyller", "Vodka cocktails". */
export function collectionTitle(c: Pick<Collection, "kind" | "label">, locale: Locale = DEFAULT_LOCALE): string {
  const t = getDictionary(locale).collections;
  return format(c.kind === "spirit" ? t.titleSpirit : t.titleFlavor, { label: c.label });
}

/** A line of introduction per known value (found by its label in the language); a new value gets the generic one. */
export function collectionIntro(c: Pick<Collection, "kind" | "label" | "count">, locale: Locale = DEFAULT_LOCALE): string {
  const t = getDictionary(locale).collections as Record<string, string>;
  const labelKey = Object.keys(t).find((key) => key.startsWith("label") && t[key] === c.label);
  const known = labelKey ? t[`intro${labelKey.slice("label".length)}`] : undefined;
  if (known) return known;
  return c.kind === "spirit"
    ? format(t.introSpiritGeneric, { label: c.label, n: c.count })
    : format(t.introFlavorGeneric, { label: c.label.toLocaleLowerCase(INTL_LOCALES[locale]), n: c.count });
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
