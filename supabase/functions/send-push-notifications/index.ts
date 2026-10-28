// Push notifications (ADR-033): woken by a trigger on public.notifications (pg_net), it claims the new rows of
// members with a device and the switch on (public.claim_push_notifications, service role only, atomic) and sends
// them through Expo's push service. A row Expo refuses is released (pushed_at back to null) so the e-mail digest
// can still carry it; tokens Expo reports as DeviceNotRegistered are deleted.
// The wording copies the site's describeNotification (src/lib/notifications.ts) and its dictionaries: keep them
// in step. A locale without its own words gets English.
import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type Row = {
  id: string;
  type: string;
  locale: string;
  tokens: string[] | null;
  actor_username: string | null;
  cocktail_id: string | null;
  cocktail_slug: string | null;
  cocktail_name: string | null;
  cocktail_author: string | null;
  log_id: string | null;
  log_name: string | null;
  comment_id: string | null;
  review_id: string | null;
  review_cocktail_slug: string | null;
  review_cocktail_name: string | null;
  review_cocktail_author: string | null;
};

const WORDS: Record<string, Record<string, string>> = {
  tr: {
    unnamed: "bir",
    unnamedCap: "Bir",
    follow: "seni takip etmeye başladı.",
    logComment: "{name} kaydına yorum yaptı.",
    commentThread: "yorum yaptığın {name} kaydına yorum yaptı.",
    recipeReview: "{name} tarifini puanladı.",
    showcaseApproved: "{name} vitrin başvurun onaylandı. Oylar seni bekliyor!",
    showcaseRejected: "{name} vitrin başvurun bu dönem onaylanmadı.",
    commentHidden: "Bir yorumun yöneticiler tarafından gizlendi.",
    reviewHidden: "{name} tarifine yaptığın değerlendirme yöneticiler tarafından gizlendi.",
    logHidden: "{name} günlük kaydın yöneticiler tarafından gizlendi.",
    recipeHidden: "{name} tarifin yöneticiler tarafından gizlendi.",
  },
  en: {
    unnamed: "untitled",
    unnamedCap: "an untitled",
    follow: "started following you.",
    logComment: "commented on your “{name}” log entry.",
    commentThread: "also commented on the “{name}” log entry you commented on.",
    recipeReview: "rated your “{name}” recipe.",
    showcaseApproved: "Your showcase entry for “{name}” was approved. The votes are waiting for you!",
    showcaseRejected: "Your showcase entry for “{name}” wasn't approved this round.",
    commentHidden: "One of your comments was hidden by the moderators.",
    reviewHidden: "Your review of “{name}” was hidden by the moderators.",
    logHidden: "Your “{name}” log entry was hidden by the moderators.",
    recipeHidden: "Your “{name}” recipe was hidden by the moderators.",
  },
};

const fill = (template: string, name: string) => template.replace("{name}", name);
const recipePath = (slug: string, author: string | null) => (author ? `/recipes/${slug}` : `/cocktails/${slug}`);

/** The sentence and the site path of one notification — the app opens the path as its own screen. */
function describe(row: Row): { text: string; href: string } {
  const n = WORDS[row.locale] ?? WORDS.en;
  const recipeName = row.cocktail_name ?? n.unnamed;
  const logName = row.log_name ?? n.unnamed;
  switch (row.type) {
    case "follow":
      return { text: n.follow, href: row.actor_username ? `/u/${row.actor_username}` : "/account" };
    case "log_comment":
      return { text: fill(n.logComment, logName), href: `/logs/${row.log_id}` };
    case "comment_thread":
      return { text: fill(n.commentThread, logName), href: `/logs/${row.log_id}` };
    case "recipe_review":
      return {
        text: fill(n.recipeReview, recipeName),
        href: row.cocktail_slug ? recipePath(row.cocktail_slug, row.cocktail_author) : "/account/recipes",
      };
    case "showcase_approved":
      return { text: fill(n.showcaseApproved, recipeName), href: "/feed#showcase" };
    case "showcase_rejected":
      return { text: fill(n.showcaseRejected, recipeName), href: "/feed#showcase" };
    default:
      if (row.comment_id) return { text: n.commentHidden, href: `/logs/${row.log_id}` };
      if (row.review_id) {
        return {
          text: fill(n.reviewHidden, row.review_cocktail_name ?? n.unnamedCap),
          href: row.review_cocktail_slug ? recipePath(row.review_cocktail_slug, row.review_cocktail_author) : "/account",
        };
      }
      if (row.log_id) return { text: fill(n.logHidden, logName), href: `/account/logs/${row.log_id}` };
      return {
        text: fill(n.recipeHidden, recipeName),
        href: row.cocktail_id ? `/account/recipes/${row.cocktail_id}` : "/account/recipes",
      };
  }
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("claim_push_notifications");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return Response.json({ sent: 0 });

  // One message per device; Expo takes up to 100 per request.
  const messages: { to: string; title: string; body: string; data: { href: string }; sound: string; rowId: string }[] = [];
  for (const row of rows) {
    const { text, href } = describe(row);
    const body = row.actor_username ? `@${row.actor_username} ${text}` : text;
    for (const to of row.tokens ?? []) messages.push({ to, title: "haci", body, data: { href }, sound: "default", rowId: row.id });
  }

  const delivered = new Set<string>();
  const deadTokens: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(batch.map(({ rowId: _, ...m }) => m)),
    });
    if (!res.ok) continue;
    const tickets = ((await res.json()) as { data?: { status: string; details?: { error?: string } }[] }).data ?? [];
    tickets.forEach((ticket, j) => {
      if (ticket.status === "ok") delivered.add(batch[j].rowId);
      else if (ticket.details?.error === "DeviceNotRegistered") deadTokens.push(batch[j].to);
    });
  }

  const undelivered = rows.map((r) => r.id).filter((id) => !delivered.has(id));
  if (undelivered.length) await supabase.from("notifications").update({ pushed_at: null }).in("id", undelivered);
  if (deadTokens.length) await supabase.from("push_tokens").delete().in("token", deadTokens);

  return Response.json({ sent: delivered.size, released: undelivered.length, removedTokens: deadTokens.length });
});
