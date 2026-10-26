// Notifications (M9 package B, ADR-030): one query and one wording for the site and the app
// (the app imports this through @shared/notifications). Browser- and React Native-safe.

import type { Database } from "./supabase/database.types";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

/** The columns a notification list selects; foreign keys are named because cocktails has two paths. */
export const NOTIFICATION_COLUMNS = `
  id, type, created_at, read_at, log_id, comment_id, review_id, entry_id, cocktail_id,
  actor:profiles!notifications_actor_id_fkey (username, display_name, avatar_path),
  cocktail:cocktails!notifications_cocktail_id_fkey (id, slug, name, author_id),
  log:drink_logs!notifications_log_id_fkey (id, recipe),
  review:reviews!notifications_review_id_fkey (cocktail:cocktails!reviews_cocktail_id_fkey (slug, name, author_id))
` as const;

export interface NotificationRow {
  id: string;
  type: NotificationType;
  created_at: string;
  read_at: string | null;
  log_id: string | null;
  comment_id: string | null;
  review_id: string | null;
  entry_id: string | null;
  cocktail_id: string | null;
  actor: { username: string; display_name: string; avatar_path: string | null } | null;
  cocktail: { id: string; slug: string; name: string; author_id: string | null } | null;
  log: { id: string; recipe: unknown } | null;
  review: { cocktail: { slug: string; name: string; author_id: string | null } | null } | null;
}

/** How many notifications a list shows (the database keeps 90 days). */
export const NOTIFICATIONS_SHOWN = 50;

export interface NotificationView {
  /** The sentence after the actor's name (or the whole sentence when there is no actor). */
  text: string;
  href: string;
}

function logName(row: NotificationRow): string {
  const recipe = row.log?.recipe;
  const name = recipe && typeof recipe === "object" && "name" in recipe ? (recipe as { name: unknown }).name : null;
  return typeof name === "string" ? name : "bir";
}

function recipePath(c: { slug: string; author_id: string | null }): string {
  return c.author_id ? `/recipes/${c.slug}` : `/cocktails/${c.slug}`;
}

/** The words and the link of one notification, in Turkish (ADR-002). */
export function describeNotification(row: NotificationRow): NotificationView {
  const recipeName = row.cocktail?.name ?? "bir";
  switch (row.type) {
    case "follow":
      return { text: "seni takip etmeye başladı.", href: row.actor ? `/u/${row.actor.username}` : "/account" };
    case "log_comment":
      return { text: `${logName(row)} kaydına yorum yaptı.`, href: `/logs/${row.log_id}` };
    case "comment_thread":
      return { text: `yorum yaptığın ${logName(row)} kaydına yorum yaptı.`, href: `/logs/${row.log_id}` };
    case "recipe_review":
      return {
        text: `${recipeName} tarifini puanladı.`,
        href: row.cocktail ? recipePath(row.cocktail) : "/account/recipes",
      };
    case "showcase_approved":
      return { text: `${recipeName} vitrin başvurun onaylandı. Oylar seni bekliyor!`, href: "/feed#showcase" };
    case "showcase_rejected":
      return { text: `${recipeName} vitrin başvurun bu dönem onaylanmadı.`, href: "/feed#showcase" };
    case "content_hidden":
      if (row.comment_id) return { text: "Bir yorumun yöneticiler tarafından gizlendi.", href: `/logs/${row.log_id}` };
      if (row.review_id) {
        const c = row.review?.cocktail;
        return {
          text: `${c?.name ?? "Bir"} tarifine yaptığın değerlendirme yöneticiler tarafından gizlendi.`,
          href: c ? recipePath(c) : "/account",
        };
      }
      if (row.log_id) {
        return { text: `${logName(row)} günlük kaydın yöneticiler tarafından gizlendi.`, href: `/account/logs/${row.log_id}` };
      }
      return {
        text: `${recipeName} tarifin yöneticiler tarafından gizlendi.`,
        href: row.cocktail_id ? `/account/recipes/${row.cocktail_id}` : "/account/recipes",
      };
  }
}
