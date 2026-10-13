import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import Avatar from "@/components/Avatar";
import { createPublicClient } from "@/lib/supabase/public";

// Public profiles, rendered on first visit and kept for a few minutes; a
// profile edit revalidates its page at once (account/actions.ts).
export const revalidate = 300;

// No profile is built ahead of time; each is rendered on its first visit and cached.
export async function generateStaticParams() {
  return [];
}

const getProfile = cache(async (username: string) => {
  const { data } = await createPublicClient()
    .from("profiles")
    .select("username, display_name, avatar_path, bio, created_at")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return { title: "Bulunamadı" };
  return {
    title: `${profile.display_name} (@${profile.username})`,
    description: profile.bio ?? undefined,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();

  const joined = new Date(profile.created_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-crimson-glow">Rx · Profil</div>
      <div className="flex items-center gap-5">
        <Avatar path={profile.avatar_path} name={profile.display_name} size={88} />
        <div>
          <h1 className="text-3xl font-bold">{profile.display_name}</h1>
          <p className="mt-1 font-mono text-sm text-text-muted">@{profile.username}</p>
        </div>
      </div>
      {profile.bio && <p className="mt-6 max-w-xl whitespace-pre-line leading-relaxed text-text-secondary">{profile.bio}</p>}
      <p className="mt-6 font-mono text-[11px] text-text-muted">{joined} tarihinden beri üye</p>
    </div>
  );
}
