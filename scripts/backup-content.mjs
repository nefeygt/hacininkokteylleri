// Weekly content backup (plan.md §7): Hacı's published house recipes, their ingredients and the
// glossary as JSON in backup/, and any house photo not yet in supabase/storage/cocktail-images/.
// Reads with the public key from .env, so it sees exactly what visitors see (drafts are not included)
// and needs no secret. Members' content is never backed up here: the repository is public.
// Run: node scripts/backup-content.mjs (the weekly GitHub Action runs it and commits any change).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1).trim()]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL or _PUBLISHABLE_KEY missing in .env");

async function read(path) {
  const response = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key } });
  if (!response.ok) throw new Error(`${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

const COCKTAIL_COLUMNS = [
  "id", "slug", "name", "subtitle", "base_alcohol", "flavor", "tags", "color", "image_path",
  "instructions", "garnish", "glass", "vegan", "note", "sort_order", "created_at", "updated_at",
].join(",");

const cocktails = await read(
  `cocktails?author_id=is.null&select=${COCKTAIL_COLUMNS},` +
    "ingredients:cocktail_ingredients(position,name,amount,unit,icon)" +
    "&order=sort_order,slug&ingredients.order=position",
);
const glossary = await read("glossary_terms?select=term,definition,created_at,updated_at&order=term");

// A sanity floor: an empty answer (an outage, a policy change) must not wipe the backup.
if (cocktails.length === 0) throw new Error("No house recipes returned; backup left as it was");

const backupDir = join(root, "backup");
mkdirSync(backupDir, { recursive: true });
writeFileSync(join(backupDir, "cocktails.json"), JSON.stringify(cocktails, null, 2) + "\n");
writeFileSync(join(backupDir, "glossary.json"), JSON.stringify(glossary, null, 2) + "\n");

// Photos are never overwritten in the bucket (ADR-006), so a file already here is current.
const imagesDir = join(root, "supabase", "storage", "cocktail-images");
let downloaded = 0;
for (const { image_path: path } of cocktails) {
  if (!path) continue;
  const target = join(imagesDir, path);
  if (existsSync(target)) continue;
  const response = await fetch(
    `${url}/storage/v1/object/public/cocktail-images/${path.split("/").map(encodeURIComponent).join("/")}`,
  );
  if (!response.ok) throw new Error(`photo ${path}: ${response.status}`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
  downloaded++;
}

console.log(`${cocktails.length} recipes, ${glossary.length} glossary terms, ${downloaded} new photos`);
