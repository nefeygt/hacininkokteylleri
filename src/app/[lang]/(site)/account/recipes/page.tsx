import type { Metadata } from "next";
import Link from "@/components/LocaleLink";
import { Globe, Lock } from "lucide-react";
import { requireMember } from "@/lib/account";

export const metadata: Metadata = {
  title: "Tariflerim",
  robots: { index: false },
};

/** The member's own recipes, drafts and published, newest first (M6). */
export default async function RecipesPage() {
  const { supabase, profile } = await requireMember();

  const { data, error } = await supabase
    .from("cocktails")
    .select("id, slug, name, subtitle, color, is_published, hidden_at, updated_at")
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Tarifler</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tariflerim</h1>
          <p className="mt-1 text-xs text-text-muted">
            Yazdığın tarifler. Yayındakiler profilinde ve akışta görünür; taslakları yalnızca sen görürsün.
          </p>
        </div>
        <Link href="/account" className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary">
          ← Hesabım
        </Link>
      </div>

      <Link
        href="/account/recipes/new"
        className="mt-8 inline-flex items-center rounded bg-crimson px-4 py-2 text-xs text-white transition-opacity hover:opacity-90"
      >
        + Yeni tarif
      </Link>

      <section className="mt-8">
        {data.length === 0 ? (
          <p className="text-xs leading-relaxed text-text-muted">Henüz tarif yok. İlk tarifini yaz.</p>
        ) : (
          <ul className="space-y-2">
            {data.map((r) => (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded border border-border bg-bg-card px-3 py-2.5 ${r.hidden_at ? "opacity-70" : ""}`}
              >
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="min-w-0 flex-1">
                  {r.is_published && !r.hidden_at ? (
                    <Link href={`/recipes/${r.slug}`} className="block truncate text-sm font-semibold text-text-primary hover:text-crimson-glow">
                      {r.name}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-semibold text-text-primary">{r.name}</span>
                  )}
                  <span className="block truncate font-mono text-[11px] text-text-muted">
                    {r.hidden_at ? "Yöneticiler tarafından gizlendi; yalnızca sen görüyorsun." : r.subtitle}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-text-muted">
                  {r.is_published ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {r.is_published ? "Yayında" : "Taslak"}
                </span>
                <Link
                  href={`/account/recipes/${r.id}`}
                  className="shrink-0 font-mono text-[11px] text-crimson-glow underline underline-offset-2"
                >
                  Düzenle
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
