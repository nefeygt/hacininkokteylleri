// Renders the brand SVGs in public/brand to the PNGs stores and devices need.
// Run after changing a logo SVG: node scripts/export-brand.mjs
import sharp from "sharp";

const brand = (name) => `public/brand/${name}`;

const jobs = [
  [brand("haci-app-icon.svg"), brand("haci-app-icon-1024.png"), 1024], // Expo / App Store
  [brand("haci-app-icon.svg"), brand("haci-play-store-512.png"), 512], // Google Play listing
  [brand("haci-app-icon.svg"), "src/app/apple-icon.png", 180], // iOS home screen for the website
  [brand("haci-mark.svg"), brand("haci-mark-1024.png"), 1024], // transparent mark (adaptive icon foreground)
  [brand("haci-wordmark-light.svg"), brand("haci-wordmark-light.png"), 1200],
  [brand("haci-wordmark-dark.svg"), brand("haci-wordmark-dark.png"), 1200],
];

for (const [from, to, width] of jobs) {
  await sharp(from, { density: 600 }).resize({ width }).png().toFile(to);
  console.log(`${to} (${width}px)`);
}
