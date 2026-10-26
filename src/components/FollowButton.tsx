"use client";

import Link from "@/components/LocaleLink";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { setFollow } from "@/app/[lang]/(site)/u/actions";
import { ACCOUNTS_OPEN } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";
import { useLocale } from "./LocaleProvider";

/**
 * "Takip et" on someone else's profile (M6). Whether the visitor already
 * follows is read in the browser, so the profile stays static (ADR-016); the
 * counts on the page come back with the action's revalidation.
 */
export default function FollowButton({ profileId, username }: { profileId: string; username: string }) {
  const router = useRouter();
  const { t, href } = useLocale();
  const [state, setState] = useState<"loading" | "hidden" | "signed-out" | "following" | "not-following">("loading");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!ACCOUNTS_OPEN) {
      setState("hidden");
      return;
    }
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const userId = data.session?.user.id;
      if (!userId) return setState("signed-out");
      if (userId === profileId) return setState("hidden");
      const { data: row } = await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", userId)
        .eq("followee_id", profileId)
        .maybeSingle();
      setState(row ? "following" : "not-following");
    });
  }, [profileId]);

  if (state === "loading" || state === "hidden") return null;

  if (state === "signed-out") {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(href(`/u/${username}`))}`}
        className="rounded border border-border px-4 py-1.5 text-xs text-text-secondary transition-colors hover:border-crimson-glow/50 hover:text-text-primary"
      >
        {t.follow.follow}
      </Link>
    );
  }

  const following = state === "following";

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await setFollow(profileId, !following);
      if (result.error) {
        setError(result.error);
        return;
      }
      setState(following ? "not-following" : "following");
      router.refresh();
    });
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="font-mono text-[10px] text-crimson-glow">{error}</span>}
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={following}
        className={`rounded px-4 py-1.5 text-xs transition-colors disabled:opacity-60 ${
          following
            ? "border border-border text-text-secondary hover:border-crimson-glow/50 hover:text-crimson-glow"
            : "bg-crimson text-white hover:bg-crimson-light"
        }`}
      >
        {following ? t.follow.following : t.follow.follow}
      </button>
    </span>
  );
}
