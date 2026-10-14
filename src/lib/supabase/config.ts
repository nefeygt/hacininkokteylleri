// Public Supabase settings. They come from .env (committed, public by design —
// ADR-008). Each variable is read by its literal name so Next.js can inline it
// into browser bundles.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. It lives in .env at the repository root.`);
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

export const SUPABASE_PUBLISHABLE_KEY = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const COCKTAIL_IMAGES_BUCKET = "cocktail-images";

/** Public URL of an object in the cocktail-images bucket. */
export function cocktailImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return `${SUPABASE_URL}/storage/v1/object/public/${COCKTAIL_IMAGES_BUCKET}/${encodeURIComponent(path)}`;
}

/** Members' profile pictures, one folder per user: "{user_id}/{name}.webp" (ADR-014). */
export const AVATARS_BUCKET = "avatars";

/** Public URL of an object in the avatars bucket. */
export function avatarUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const key = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${AVATARS_BUCKET}/${key}`;
}

/** Members' recipe photos, one folder per author: "{user_id}/{name}.webp" (M6, ADR-018). */
export const RECIPE_IMAGES_BUCKET = "recipe-images";

/** Public URL of an object in the recipe-images bucket. */
export function recipeImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const key = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${RECIPE_IMAGES_BUCKET}/${key}`;
}
