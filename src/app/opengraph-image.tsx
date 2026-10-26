import { OG_SIZE, ogCard } from "@/lib/og-card";

// The site's share card: every page without its own image inherits it.
export const alt = "haci — kokteyl reçeteleri";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    label: "Kokteyl arşivi",
    title: "Her biri özenle formüle edilmiş kokteyl reçeteleri",
  });
}
