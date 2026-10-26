// Notification e-mails (ADR-031): every 15 minutes (pg_cron), one digest per member with unread notifications
// that are not e-mailed yet (public.pending_notification_emails, service role only), sent through Resend.
// Until the RESEND_API_KEY secret is set in Supabase, it sends nothing and marks nothing.
// Wording per locale below; a locale without its own words gets English (M9 translation, more languages later).
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE_URL = "https://hacininkokteylleri.tech";
const FROM = "haci <noreply@hacininkokteylleri.tech>";

type Words = {
  subject: (n: number) => string;
  hello: (name: string) => string;
  intro: string;
  types: Record<string, (n: number) => string>;
  button: string;
  footer: string;
};

const WORDS: Record<string, Words> = {
  tr: {
    subject: (n) => `haci'de ${n} yeni bildirimin var`,
    hello: (name) => `Merhaba ${name},`,
    intro: "Sen yokken olanlar:",
    types: {
      follow: (n) => `${n} yeni takipçi`,
      log_comment: (n) => `kayıtlarına ${n} yorum`,
      comment_thread: (n) => `yorum yaptığın kayıtlarda ${n} yeni yorum`,
      recipe_review: (n) => `tariflerine ${n} yeni puan`,
      showcase_approved: () => "vitrin başvurun onaylandı",
      showcase_rejected: () => "vitrin başvurun hakkında bir karar",
      content_hidden: (n) => `${n} içeriğin yöneticiler tarafından gizlendi`,
    },
    button: "Bildirimlerine bak",
    footer: "Bu e-postaları Hesabım sayfasından kapatabilirsin.",
  },
  en: {
    subject: (n) => `${n} new notification${n === 1 ? "" : "s"} on haci`,
    hello: (name) => `Hi ${name},`,
    intro: "While you were away:",
    types: {
      follow: (n) => `${n} new follower${n === 1 ? "" : "s"}`,
      log_comment: (n) => `${n} comment${n === 1 ? "" : "s"} on your logs`,
      comment_thread: (n) => `${n} new comment${n === 1 ? "" : "s"} on logs you commented on`,
      recipe_review: (n) => `${n} new rating${n === 1 ? "" : "s"} on your recipes`,
      showcase_approved: () => "your showcase application was approved",
      showcase_rejected: () => "a decision on your showcase application",
      content_hidden: (n) => `${n} of your posts ${n === 1 ? "was" : "were"} hidden by the moderators`,
    },
    button: "See your notifications",
    footer: "You can turn these e-mails off on your account page.",
  },
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function digest(locale: string, name: string, types: string[]) {
  const w = WORDS[locale] ?? WORDS.en;
  const counts = new Map<string, number>();
  for (const t of types) counts.set(t, (counts.get(t) ?? 0) + 1);
  const lines = [...counts].map(([t, n]) => w.types[t]?.(n)).filter(Boolean) as string[];
  const link = `${SITE_URL}${locale === "tr" ? "" : `/${locale}`}/account/notifications`;
  const html = `<div style="font-family:system-ui,sans-serif;background:#0d0d0d;color:#e8e6e3;padding:32px">
<p style="color:#d0453a;font-family:monospace;font-size:11px;letter-spacing:3px">RX · HACI</p>
<p>${escapeHtml(w.hello(name))}</p><p>${escapeHtml(w.intro)}</p>
<ul>${lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>
<p><a href="${link}" style="display:inline-block;background:#8b1a1a;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none">${escapeHtml(w.button)}</a></p>
<p style="color:#7d7a78;font-size:12px">${escapeHtml(w.footer)}</p></div>`;
  const text = `${w.hello(name)}\n\n${w.intro}\n${lines.map((l) => `- ${l}`).join("\n")}\n\n${w.button}: ${link}\n\n${w.footer}`;
  return { subject: w.subject(types.length), html, text };
}

Deno.serve(async () => {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return Response.json({ skipped: "RESEND_API_KEY is not set" });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("pending_notification_emails");
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let sent = 0;
  const failed: string[] = [];
  for (const row of data as { user_id: string; email: string; locale: string; display_name: string; notification_ids: string[]; types: string[] }[]) {
    const mail = digest(row.locale, row.display_name, row.types);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: row.email, subject: mail.subject, html: mail.html, text: mail.text }),
    });
    if (!res.ok) {
      failed.push(`${row.user_id}: ${res.status}`);
      continue;
    }
    await supabase.from("notifications").update({ emailed_at: new Date().toISOString() }).in("id", row.notification_ids);
    sent++;
  }
  return Response.json({ sent, failed });
});
