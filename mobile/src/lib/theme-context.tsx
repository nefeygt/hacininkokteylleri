import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, type ThemeId, isThemeId } from "@shared/themes";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { StyleSheet } from "react-native";
import { FONT_SETS, PALETTES, type Theme } from "@/lib/theme";

type Styles = StyleSheet.NamedStyles<any>;
type ThemeValue = Theme & { setTheme: (id: ThemeId) => void };

const ThemeContext = createContext<ThemeValue | null>(null);

function themeOf(id: ThemeId): Theme {
  const light = THEMES.find((theme) => theme.id === id)?.light ?? false;
  return { id, light, colors: PALETTES[id], fonts: FONT_SETS[id] };
}

/** Holds the chosen theme (kept in AsyncStorage like the site's localStorage) and keeps the splash screen up until it is read. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<ThemeId>(DEFAULT_THEME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (isThemeId(stored)) setId(stored);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setTheme = useCallback((next: ThemeId) => {
    setId(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ ...themeOf(id), setTheme }), [id, setTheme]);

  if (!ready) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme needs a ThemeProvider");
  return value;
}

/** Styles that depend on the theme: `const makeStyles = (t: Theme) => StyleSheet.create({...})`, then `useStyles(makeStyles)` in the component. */
export function useStyles<T extends Styles>(make: (t: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => make(theme), [make, theme]);
}
