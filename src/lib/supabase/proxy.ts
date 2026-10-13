import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Builds the response with `respond` and refreshes the Supabase session on the
 * way, so Server Components (which cannot write cookies) always see a fresh
 * token. Follows Supabase's Next.js guide; do not put code between
 * createServerClient and getClaims.
 */
async function withSession(request: NextRequest, respond: () => NextResponse) {
  let response = respond();

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = respond();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  await supabase.auth.getClaims();

  return response;
}

/** The admin host: rewrite into src/app/admin with a fresh session. */
export function rewriteWithSession(request: NextRequest, destination: URL) {
  return withSession(request, () => NextResponse.rewrite(destination, { request }));
}

/** The public host's account pages: pass through with a fresh session. */
export function nextWithSession(request: NextRequest) {
  return withSession(request, () => NextResponse.next({ request }));
}
