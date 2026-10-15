import { SITE_URL, supabase } from "./supabase";

/**
 * The site's static pages do not see the app's writes, so after one the app
 * asks the site to refresh the pages it touched (POST /api/revalidate, ADR-020).
 * "/recipes/[slug]" means every recipe page. Failures are ignored: the pages
 * catch up within their revalidation window anyway.
 */
export async function revalidateSite(paths: string[]): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token || paths.length === 0) return;
    await fetch(`${SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paths: [...new Set(paths)].slice(0, 8) }),
    });
  } catch {
    // Offline or the site is down: ISR catches up.
  }
}
