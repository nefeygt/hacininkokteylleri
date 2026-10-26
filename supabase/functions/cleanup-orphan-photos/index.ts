// Removes orphaned photos (M9 Icebox round): uploads that no recipe or profile points at, older than a day.
// public.orphan_photos() finds them (service role only); the Storage API removes them, since SQL may not.
// Called weekly by .github/workflows/cleanup-photos.yml. Harmless to call more often: it only ever
// deletes files nothing uses. The service key is Supabase's own runtime secret, never in the app (ADR-007).
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("orphan_photos");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const byBucket = new Map<string, string[]>();
  for (const row of data as { bucket_id: string; name: string }[]) {
    byBucket.set(row.bucket_id, [...(byBucket.get(row.bucket_id) ?? []), row.name]);
  }

  const removed: Record<string, number> = {};
  for (const [bucket, names] of byBucket) {
    const { data: gone, error: removeError } = await supabase.storage.from(bucket).remove(names);
    if (removeError) return Response.json({ error: removeError.message, bucket }, { status: 500 });
    removed[bucket] = gone?.length ?? 0;
  }

  return Response.json({ removed });
});
