import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

// The public pages. Cocktails open in a modal on /kokteyller and have no page
// of their own yet (plan.md §9), so they are not listed separately.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/kokteyller`, changeFrequency: "weekly", priority: 0.8 },
  ];
}
