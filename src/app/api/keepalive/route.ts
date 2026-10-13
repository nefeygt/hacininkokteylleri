import { createPublicClient } from "@/lib/supabase/public";

// Supabase pauses a free project after a week without traffic, and a paused
// project takes the site's photos down with it. Vercel calls this once a day
// (vercel.json) so that never happens (ADR-005).
export const dynamic = "force-dynamic";

export async function GET() {
  const { count, error } = await createPublicClient()
    .from("cocktails")
    .select("id", { count: "exact", head: true });

  if (error) return Response.json({ ok: false, error: error.message }, { status: 503 });
  return Response.json({ ok: true, cocktails: count });
}
