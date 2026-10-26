import type { MetadataRoute } from "next";
import { collectionHref, collectionKey, collections, type Collection } from "@/lib/collections";
import { getPublishedCocktails } from "@/lib/content";
import { DEFAULT_LOCALE, localePath, PUBLISHED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { createPublicClient } from "@/lib/supabase/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

// Refreshed hourly, like the archive (ADR-005).
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/**
 * One entry per published language for a page, each listing all the versions of it (hreflang, ADR-032).
 * `paths` maps a language to the page's unprefixed path in it; a language without a path has no version.
 * While Turkish is the only published language the entries carry no alternates, as before.
 */
function localized(paths: Partial<Record<Locale, string>>, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  const langs = PUBLISHED_LOCALES.filter((l) => paths[l]);
  const urls = Object.fromEntries(langs.map((l) => [l, `${SITE_URL}${localePath(l, paths[l]!)}`]));
  const languages: Record<string, string> = { ...urls };
  if (urls[DEFAULT_LOCALE]) languages["x-default"] = urls[DEFAULT_LOCALE];
  return langs.map((l) => ({ url: urls[l], ...rest, ...(langs.length > 1 ? { alternates: { languages } } : {}) }));
}

/** The same path in every published language. */
function everywhere(path: string, rest: Omit<Entry, "url" | "alternates">): Entry[] {
  return localized(Object.fromEntries(PUBLISHED_LOCALES.map((l) => [l, path])), rest);
}

// The public pages: house recipes (ADR-025) and members' published recipes
// (M6) each have a page. Profiles and drink logs are left out: people's pages
// are shared by link.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const [{ data: cocktails }, { data: recipes }, ...archives] = await Promise.all([
    supabase
      .from("cocktails")
      .select("slug, updated_at")
      .is("author_id", null)
      .eq("is_published", true)
      .order("sort_order"),
    supabase
      .from("cocktails")
      .select("slug, updated_at")
      .not("author_id", "is", null)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(5000),
    ...PUBLISHED_LOCALES.map((l) => getPublishedCocktails(l)),
  ]);
  const archiveOf = new Map(PUBLISHED_LOCALES.map((l, i) => [l, archives[i]]));

  // The collections' landing pages (M9 package C). Their addresses come from the language's own labels
  // ("votka" / "vodka"), so the language versions are matched by the dictionary's key for the label.
  const landing: Entry[] = [];
  for (const kind of ["spirit", "flavor"] as const) {
    const byLanguage = new Map<Locale, Collection[]>(PUBLISHED_LOCALES.map((l) => [l, collections(kind, archiveOf.get(l) ?? [])]));
    for (const lead of PUBLISHED_LOCALES) {
      for (const c of byLanguage.get(lead) ?? []) {
        const key = collectionKey(c.label, lead);
        // Each version is listed once, from the first language that has it.
        if (key && PUBLISHED_LOCALES.slice(0, PUBLISHED_LOCALES.indexOf(lead)).some((l) => (byLanguage.get(l) ?? []).some((o) => collectionKey(o.label, l) === key))) {
          continue;
        }
        const paths: Partial<Record<Locale, string>> = { [lead]: collectionHref(c) };
        if (key) {
          for (const l of PUBLISHED_LOCALES) {
            const other = (byLanguage.get(l) ?? []).find((o) => collectionKey(o.label, l) === key);
            if (other) paths[l] = collectionHref(other);
          }
        }
        landing.push(...localized(paths, { changeFrequency: "weekly", priority: 0.7 }));
      }
    }
  }

  return [
    ...everywhere("/", { changeFrequency: "monthly", priority: 1 }),
    ...everywhere("/cocktails", { changeFrequency: "weekly", priority: 0.8 }),
    ...everywhere("/what-can-i-make", { changeFrequency: "weekly", priority: 0.7 }),
    ...everywhere("/feed", { changeFrequency: "daily", priority: 0.6 }),
    ...everywhere("/glossary", { changeFrequency: "monthly", priority: 0.5 }),
    ...landing,
    ...(cocktails ?? []).flatMap((c) =>
      everywhere(`/cocktails/${c.slug}`, { lastModified: c.updated_at, changeFrequency: "monthly", priority: 0.7 }),
    ),
    ...(recipes ?? []).flatMap((r) =>
      everywhere(`/recipes/${r.slug}`, { lastModified: r.updated_at, changeFrequency: "weekly", priority: 0.5 }),
    ),
  ];
}
