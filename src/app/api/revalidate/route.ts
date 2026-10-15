import { revalidatePath } from "next/cache";
import { SLUG_PATTERN } from "@/lib/slug";
import { createPublicClient } from "@/lib/supabase/public";

// The app writes straight to the database, so the site's static pages do not
// hear about it. After a write the app calls this route with the member's
// access token and the paths its write touched (ADR-020). Only members may
// call it, and only site paths of known shapes are revalidated — what any
// member can already trigger by writing on the site. No secret key involved.

const MAX_PATHS = 8;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const SHAPES = [
  /^\/$/,
  /^\/cocktails$/,
  /^\/feed$/,
  /^\/u\/[a-z0-9_]{3,20}$/,
  new RegExp(`^/logs/${UUID}$`),
];

/** "/recipes/[slug]" refreshes every recipe page (a review moves averages everywhere, as cocktails/actions.ts does). */
const EVERY_RECIPE_PAGE = "/recipes/[slug]";

function allowed(path: string): boolean {
  if (path === EVERY_RECIPE_PAGE) return true;
  if (path.startsWith("/recipes/")) return SLUG_PATTERN.test(path.slice("/recipes/".length));
  return SHAPES.some((shape) => shape.test(path));
}

// Bearer tokens, never cookies, so any origin may call it (Expo web in development).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function reply(body: object, status = 200) {
  return Response.json(body, { status, headers: CORS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return reply({ ok: false, error: "unauthorized" }, 401);

  const { data, error } = await createPublicClient().auth.getUser(token);
  if (error || !data.user) return reply({ ok: false, error: "unauthorized" }, 401);

  const body: unknown = await request.json().catch(() => null);
  const paths = (body as { paths?: unknown } | null)?.paths;
  if (
    !Array.isArray(paths) ||
    paths.length === 0 ||
    paths.length > MAX_PATHS ||
    !paths.every((p): p is string => typeof p === "string" && allowed(p))
  ) {
    return reply({ ok: false, error: "bad paths" }, 400);
  }

  for (const path of new Set(paths)) {
    if (path === EVERY_RECIPE_PAGE) revalidatePath(path, "page");
    else revalidatePath(path);
  }
  return reply({ ok: true, revalidated: paths.length });
}
