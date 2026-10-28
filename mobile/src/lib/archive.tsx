import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n";
import { fetchArchive, type Archive } from "./content";

interface ArchiveState {
  archive: Archive | null;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

const ArchiveContext = createContext<ArchiveState | null>(null);

/**
 * The archive and the glossary, loaded once when the app opens and shared by
 * every screen (the list, a recipe, later the log form). Pull to refresh
 * reloads it — the site's equivalent is the page's hourly revalidation.
 */
export function ArchiveProvider({ children }: { children: ReactNode }) {
  const [archive, setArchive] = useState<Archive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { locale } = useLocale();

  // A language change loads the archive again, in the new language.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setArchive(await fetchArchive(locale));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }, [locale]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ArchiveContext.Provider value={{ archive, error, refreshing, refresh }}>{children}</ArchiveContext.Provider>
  );
}

export function useArchive(): ArchiveState {
  const state = useContext(ArchiveContext);
  if (!state) throw new Error("useArchive needs an ArchiveProvider");
  return state;
}
