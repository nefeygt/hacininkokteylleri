import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

// Served on the public host only; on admin.* the proxy maps /robots.txt into
// the panel, which has no such route, and every panel page is noindex anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
