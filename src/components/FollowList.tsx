import Link from "@/components/LocaleLink";
import Avatar from "@/components/Avatar";
import { createPublicClient } from "@/lib/supabase/public";

export type FollowListKind = "followers" | "following";

/** How many people a list shows; the page says when there are more. */
const SHOWN = 200;

interface Person {
  username: string;
  display_name: string;
  avatar_path: string | null;
  bio: string | null;
}

/** A profile's followers or the people they follow, newest follow first; hidden profiles left out (RLS). */
export async function loadFollowList(profileId: string, kind: FollowListKind): Promise<{ people: Person[]; total: number }> {
  const supabase = createPublicClient();
  const columns = "username, display_name, avatar_path, bio";
  const query =
    kind === "followers"
      ? supabase
          .from("follows")
          .select(`created_at, person:profiles!follows_follower_id_fkey (${columns})`, { count: "exact" })
          .eq("followee_id", profileId)
      : supabase
          .from("follows")
          .select(`created_at, person:profiles!follows_followee_id_fkey (${columns})`, { count: "exact" })
          .eq("follower_id", profileId);
  const { data, count, error } = await query.order("created_at", { ascending: false }).limit(SHOWN);
  if (error) throw new Error(error.message);
  const people = (data as unknown as { person: Person | null }[]).flatMap((row) => (row.person ? [row.person] : []));
  return { people, total: count ?? people.length };
}

export default function FollowList({
  owner,
  kind,
  people,
  total,
}: {
  owner: { username: string; display_name: string };
  kind: FollowListKind;
  people: Person[];
  total: number;
}) {
  const title = kind === "followers" ? "Takipçiler" : "Takip ettikleri";
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Profil</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold">
          {title} <span className="text-text-muted">({total})</span>
        </h1>
        <Link
          href={`/u/${owner.username}`}
          className="font-mono text-[11px] text-text-muted underline underline-offset-2 hover:text-text-primary"
        >
          ← @{owner.username}
        </Link>
      </div>
      <nav className="mt-6 flex gap-2 font-mono text-[11px]" aria-label="Listeler">
        {(["followers", "following"] as const).map((k) => (
          <Link
            key={k}
            href={`/u/${owner.username}/${k}`}
            aria-current={k === kind ? "page" : undefined}
            className={`rounded px-3 py-1.5 transition-colors ${
              k === kind ? "bg-crimson/15 text-crimson-glow" : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
            }`}
          >
            {k === "followers" ? "Takipçiler" : "Takip ettikleri"}
          </Link>
        ))}
      </nav>

      {people.length === 0 ? (
        <p className="mt-8 text-xs text-text-muted">
          {kind === "followers"
            ? `${owner.display_name} henüz kimse tarafından takip edilmiyor.`
            : `${owner.display_name} henüz kimseyi takip etmiyor.`}
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded border border-border bg-bg-card">
          {people.map((p) => (
            <li key={p.username}>
              <Link href={`/u/${p.username}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-elevated">
                <Avatar path={p.avatar_path} name={p.display_name} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{p.display_name}</p>
                  <p className="truncate font-mono text-[11px] text-text-muted">
                    @{p.username}
                    {p.bio && <span className="text-text-secondary"> · {p.bio}</span>}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {total > people.length && (
        <p className="mt-4 font-mono text-[11px] text-text-muted">İlk {people.length} kişi gösteriliyor.</p>
      )}
    </div>
  );
}
