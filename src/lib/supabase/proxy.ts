import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * Rewrites the request to `destination` and refreshes the Supabase session on
 * the way, so Server Components (which cannot write cookies) always see a
 * fresh token. Follows Supabase's Next.js guide; do not put code between
 * createServerClient and getClaims.
 */
export async function rewriteWithSession(request: NextRequest, destination: URL) {
  let response = NextResponse.rewrite(destination, { request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.rewrite(destination, { request });
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
