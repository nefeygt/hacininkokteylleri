import { router } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { setFavorite } from "./community";
import { useSession } from "./session";
import { supabase } from "./supabase";

interface FavoritesValue {
  /** The cocktails the member saved; empty when signed out. */
  favorites: Set<string>;
  /**
   * The heart: toggled at once and put back if the database refuses (the
   * site's useMember). A visitor without a profile is sent to the Hesap tab.
   * Returns an error message, if any.
   */
  toggle: (cocktailId: string) => Promise<string | null>;
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

  useEffect(() => {
    reload();
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
    async (cocktailId: string) => {
      if (!member) {
        router.navigate("/account");
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

  return <FavoritesContext.Provider value={{ favorites, toggle, reload }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error("useFavorites outside FavoritesProvider");
  return value;
}
