import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

// Refreshed hourly, like the archive (ADR-005).
export const revalidate = 3600;

// The public pages. House recipes open in a modal on /cocktails and have no
// page of their own yet (plan.md §9); members' published recipes do (M6).
// Profiles and drink logs are left out: people's pages are shared by link.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: recipes } = await createPublicClient()
    .from("cocktails")
    .select("slug, updated_at")
    .not("author_id", "is", null)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/cocktails`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/feed`, changeFrequency: "daily", priority: 0.6 },
    ...(recipes ?? []).map((r) => ({
      url: `${SITE_URL}/recipes/${r.slug}`,
      lastModified: r.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
