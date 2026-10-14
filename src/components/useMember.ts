"use client";

import { useCallback, useEffect, useState } from "react";
import { ACCOUNTS_OPEN } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";

export type Member =
  | { state: "loading" | "signed-out" }
  | { state: "onboarding"; id: string }
  | { state: "ok"; id: string; username: string };

/**
 * The visitor, read in the browser so the archive stays a static page
 * (ADR-005), and the cocktails they saved. Favourites are toggled
 * optimistically by the caller and put back if the server refuses.
 */
export function useMember() {
  const [member, setMember] = useState<Member>({ state: ACCOUNTS_OPEN ? "loading" : "signed-out" });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ACCOUNTS_OPEN) return;
    const supabase = createClient();
    let cancelled = false;

    async function load(userId: string | undefined) {
      if (!userId) {
        if (!cancelled) {
          setMember({ state: "signed-out" });
          setFavorites(new Set());
        }
        return;
      }
      const [{ data: profile }, { data: saved }] = await Promise.all([
        supabase.from("profiles").select("username").eq("id", userId).maybeSingle(),
        supabase.from("favorites").select("cocktail_id").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setMember(profile ? { state: "ok", id: userId, username: profile.username } : { state: "onboarding", id: userId });
      setFavorites(new Set((saved ?? []).map((f) => f.cocktail_id)));
    }

    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") load(session?.user.id);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const markFavorite = useCallback((cocktailId: string, on: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (on) next.add(cocktailId);
      else next.delete(cocktailId);
      return next;
    });
  }, []);

  return { member, favorites, markFavorite };
}
