import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

// Refreshed hourly, like the archive (ADR-005).
export const revalidate = 3600;

// The public pages: house recipes (ADR-025) and members' published recipes
// (M6) each have a page. Profiles and drink logs are left out: people's pages
// are shared by link.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const [{ data: cocktails }, { data: recipes }] = await Promise.all([
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
  ]);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/cocktails`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/what-can-i-make`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/feed`, changeFrequency: "daily", priority: 0.6 },
    ...(cocktails ?? []).map((c) => ({
      url: `${SITE_URL}/cocktails/${c.slug}`,
      lastModified: c.updated_at,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(recipes ?? []).map((r) => ({
      url: `${SITE_URL}/recipes/${r.slug}`,
      lastModified: r.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
