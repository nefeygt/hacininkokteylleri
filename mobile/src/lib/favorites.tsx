import type { Href } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { askToSignIn, takePendingFavorite } from "./after-sign-in";
import { setFavorite } from "./community";
import { useSession } from "./session";
import { supabase } from "./supabase";

interface FavoritesValue {
  /** The cocktails the member saved; empty when signed out. */
  favorites: Set<string>;
  /**
   * The heart: toggled at once and put back if the database refuses (the
   * site's useMember). A visitor without a profile is sent to the Hesap tab,
   * brought back to `from` after signing in, and the heart is saved then.
   * Returns an error message, if any.
   */
  toggle: (cocktailId: string, from?: Href) => Promise<string | null>;
  /** A cocktail saved for the member on signing in, for a few seconds: the recipe says so. */
  savedOnSignIn: string | null;
  /** Reads the list again (pull to refresh). */
  reload: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesValue | null>(null);

/** The member's favourites, shared by the archive (hearts, "Favorilerim") and the recipe screen. */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const member = session.state === "ok" ? session.profile : null;
  const memberId = member?.id ?? null;
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    if (!memberId) {
      setFavorites(new Set());
      return;
    }
    const { data } = await supabase.from("favorites").select("cocktail_id").eq("user_id", memberId);
    setFavorites(new Set((data ?? []).map((f) => f.cocktail_id)));
  }, [memberId]);

  const [savedOnSignIn, setSavedOnSignIn] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // A heart tapped before signing in is saved first, so the list read next has it.
      const pending = member ? takePendingFavorite() : null;
      if (member && pending) {
        const result = await setFavorite({ id: member.id, username: member.username }, pending, true);
        if (!result.error && !cancelled) {
          setSavedOnSignIn(pending);
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSavedOnSignIn(null), 4000);
        }
      }
      if (!cancelled) await reload();
    })();
    return () => {
      cancelled = true;
    };
    // The member's id is what matters; the profile object changes on every reload.
  }, [reload]);

  const mark = useCallback((cocktailId: string, on: boolean) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (on) next.add(cocktailId);
      else next.delete(cocktailId);
      return next;
    });
  }, []);

  const toggle = useCallback(
    async (cocktailId: string, from?: Href) => {
      if (!member) {
        askToSignIn(from, cocktailId);
        return null;
      }
      const on = !favorites.has(cocktailId);
      mark(cocktailId, on);
      const result = await setFavorite({ id: member.id, username: member.username }, cocktailId, on);
      if (result.error) {
        mark(cocktailId, !on);
        return result.error;
      }
      return null;
    },
    [member, favorites, mark]
  );

  return <FavoritesContext.Provider value={{ favorites, toggle, savedOnSignIn, reload }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites outside FavoritesProvider");
  return value;
}
