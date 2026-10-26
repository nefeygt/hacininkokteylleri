import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import Avatar from "@/components/Avatar";
import NotificationsSeen from "@/components/NotificationsSeen";
import { requireMember } from "@/lib/account";
import {
  describeNotification,
  NOTIFICATION_COLUMNS,
  NOTIFICATIONS_SHOWN,
  type NotificationRow,
} from "@/lib/notifications";

export const metadata: Metadata = {
  title: "Bildirimler",
  robots: { index: false },
};

function formatWhen(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  });
}

/** What happened to the member's things (ADR-030). Opening the page marks everything read. */
export default async function NotificationsPage() {
  const { supabase, profile } = await requireMember();

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_SHOWN);
  if (error) throw new Error(error.message);
  const rows = data as unknown as NotificationRow[];

  const unread = rows.some((row) => !row.read_at);
  if (unread) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile.id).is("read_at", null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <NotificationsSeen />
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Bildirimler</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bildirimler</h1>
          <p className="mt-1 text-xs text-text-muted">Seni takip edenler, kayıtlarına gelen yorumlar, vitrin kararları. Son 90 gün.</p>
        </div>
        <Link href="/account" className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary">
          ← Hesabım
        </Link>
      </div>

      <section className="mt-8">
        {rows.length === 0 ? (
          <p className="text-xs leading-relaxed text-text-muted">
            Henüz bildirim yok. Biri seni takip ettiğinde, kayıtlarına yorum yaptığında ya da tariflerini puanladığında burada görürsün.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded border border-border bg-bg-card">
            {rows.map((row) => {
              const { text, href } = describeNotification(row);
              return (
                <li key={row.id}>
                  <Link
                    href={href}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-bg-elevated ${
                      row.read_at ? "" : "bg-crimson/5"
                    }`}
                  >
                    {row.actor ? (
                      <Avatar path={row.actor.avatar_path} name={row.actor.display_name} size={32} />
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated font-mono text-[10px] text-crimson-glow">
                        Rx
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-text-primary">
                        {row.actor && <span className="font-semibold">@{row.actor.username} </span>}
                        {text}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-text-muted">{formatWhen(row.created_at)}</p>
                    </div>
                    {!row.read_at && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-crimson-glow" aria-label="Yeni" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
