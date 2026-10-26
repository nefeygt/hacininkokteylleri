import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

// A page's openGraph replaces the root layout's whole object, so every page that sets one starts here.
export const OPEN_GRAPH_BASE = { siteName: BRAND, locale: "tr_TR", type: "website" } satisfies Metadata["openGraph"];

/** The share image of a recipe page: its photo, else the generated card under /og. */
export function recipeOpenGraph(path: string, imageUrl?: string): Metadata["openGraph"] {
  return { ...OPEN_GRAPH_BASE, url: path, images: [imageUrl ?? `/og${path}`] };
}
