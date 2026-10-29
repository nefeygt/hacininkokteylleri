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

// The Expo app's icons (M8, ADR-020), into mobile/assets/images.
const app = (name) => `mobile/assets/images/${name}`;

await sharp(brand("haci-app-icon.svg"), { density: 600 }).resize({ width: 1024 }).png().toFile(app("icon.png"));
await sharp(brand("haci-app-icon.svg"), { density: 300 }).resize({ width: 48 }).png().toFile(app("favicon.png"));
await sharp(brand("haci-mark.svg"), { density: 600 }).resize({ width: 1024 }).png().toFile(app("splash-icon.png"));

// Android's adaptive icon crops the foreground to a shape: the mark must sit
// inside the central 66% safe zone, so it is drawn at 760 px on a 1024 canvas.
const mark = await sharp(brand("haci-mark.svg"), { density: 600 }).resize({ width: 760 }).png().toBuffer();
const canvas = { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } };
await sharp({ create: canvas }).composite([{ input: mark, gravity: "centre" }]).png().toFile(app("android-icon-foreground.png"));

// The monochrome (themed) icon: the same silhouette in white.
const alpha = await sharp(mark).extractChannel("alpha").toBuffer();
const silhouette = await sharp({ create: { width: 760, height: 760, channels: 3, background: "#ffffff" } })
  .joinChannel(alpha)
  .png()
  .toBuffer();
await sharp({ create: canvas }).composite([{ input: silhouette, gravity: "centre" }]).png().toFile(app("android-icon-monochrome.png"));

// Android's status-bar notification icon: white on transparent, 96 px, a little padding.
// Without it Android draws the full-colour app icon as a white square.
const small = await sharp(silhouette).resize({ width: 80 }).png().toBuffer();
await sharp({ create: { ...canvas, width: 96, height: 96 } })
  .composite([{ input: small, gravity: "centre" }])
  .png()
  .toFile(app("notification-icon.png"));
console.log("mobile/assets/images: icon, favicon, splash-icon, android-icon-foreground, android-icon-monochrome, notification-icon");

// Google Play's feature graphic (1024 x 500): the light wordmark centred on the Rx background.
// Store material, not an app asset, so it goes to store/ (docs/play-store.md §4).
const wordmark = await sharp(brand("haci-wordmark-light.svg"), { density: 600 }).resize({ height: 260 }).png().toBuffer();
await sharp({ create: { width: 1024, height: 500, channels: 3, background: "#0d0d0d" } })
  .composite([{ input: wordmark, gravity: "centre" }])
  .png()
  .toFile("store/feature-graphic.png");
console.log("store/feature-graphic.png (1024x500)");
