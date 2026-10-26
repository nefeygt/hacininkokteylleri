import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import FollowList, { loadFollowList } from "@/components/FollowList";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { asLocale } from "@/lib/i18n/locales";
import { createPublicClient } from "@/lib/supabase/public";

// Like the profile: rendered on first visit, kept a few minutes, revalidated by a follow (u/actions.ts).
export const revalidate = 300;

export async function generateStaticParams() {
  return [];
}

const getOwner = cache(async (username: string) => {
  const { data } = await createPublicClient()
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data;
});

type Params = Promise<{ lang: string; username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang: rawLang, username } = await params;
  const t = getDictionary(asLocale(rawLang));
  const owner = await getOwner(username);
  if (!owner) return { title: t.status.notFoundMeta };
  return { title: `${owner.display_name} — ${t.follow.followingTitle.toLocaleLowerCase(asLocale(rawLang))}`, robots: { index: false } };
}

export default async function Page({ params }: { params: Params }) {
  const { lang, username } = await params;
  const owner = await getOwner(username);
  if (!owner) notFound();
  const { people, total } = await loadFollowList(owner.id, "following");
  return <FollowList owner={owner} kind="following" people={people} total={total} lang={asLocale(lang)} />;
}
