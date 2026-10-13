import Image from "next/image";
import Link from "next/link";
import { Plus, Wine } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { cocktailImageUrl } from "@/lib/supabase/config";
import PublishToggle from "../PublishToggle";

export default async function AdminCocktailsPage() {
  const { supabase } = await requireAdmin();
  const { data: cocktails, error } = await supabase
    .from("cocktails")
    .select("id, name, subtitle, base_alcohol, image_path, is_published, sort_order")
    .order("sort_order");

  if (error) throw new Error(error.message);
  const published = cocktails.filter((c) => c.is_published).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kokteyller</h1>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {cocktails.length} kokteyl · {published} yayında
          </p>
        </div>
        <Link
          href="/cocktails/new"
          className="inline-flex items-center gap-2 rounded bg-crimson px-4 py-2.5 font-mono text-sm font-medium text-white hover:bg-crimson-light"
        >
          <Plus className="h-4 w-4" /> Yeni kokteyl
        </Link>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-sm border border-border bg-bg-card">
        {cocktails.map((c) => {
          const imageUrl = cocktailImageUrl(c.image_path);
          return (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 sm:gap-4">
              <Link
                href={`/cocktails/${c.id}`}
                className="relative h-12 w-20 shrink-0 overflow-hidden rounded-sm bg-bg-elevated"
              >
                {imageUrl ? (
                  <Image src={imageUrl} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <Wine className="absolute inset-0 m-auto h-5 w-5 text-text-muted/40" />
                )}
              </Link>
              <Link href={`/cocktails/${c.id}`} className="min-w-0 flex-1">
                <div className="truncate font-medium">{c.name}</div>
                <div className="truncate font-mono text-[11px] text-text-muted">
                  {c.base_alcohol} · {c.subtitle}
                </div>
              </Link>
              <span className="hidden font-mono text-[10px] text-text-muted sm:inline">#{c.sort_order}</span>
              <PublishToggle id={c.id} published={c.is_published} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
