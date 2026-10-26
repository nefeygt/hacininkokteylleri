import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// "Add to home screen": the site opens like an app, in Rx's colours (ADR-028's default theme).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND,
    short_name: BRAND,
    description: "Hacı'nın kokteyl reçeteleri, üyelerin tarifleri ve içki günlükleri.",
    lang: "tr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0d0d0d",
    theme_color: "#0d0d0d",
    icons: [
      { src: "/brand/haci-play-store-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/haci-app-icon-1024.png", sizes: "1024x1024", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
