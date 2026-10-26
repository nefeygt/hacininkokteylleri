import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import FollowList, { loadFollowList } from "@/components/FollowList";
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

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const owner = await getOwner((await params).username);
  if (!owner) return { title: "Bulunamadı" };
  return { title: `${owner.display_name} — takipçiler`, robots: { index: false } };
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const owner = await getOwner((await params).username);
  if (!owner) notFound();
  const { people, total } = await loadFollowList(owner.id, "followers");
  return <FollowList owner={owner} kind="followers" people={people} total={total} />;
}
