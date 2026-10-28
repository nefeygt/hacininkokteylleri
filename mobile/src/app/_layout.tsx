import { AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from "@expo-google-fonts/atkinson-hyperlegible";
import { BricolageGrotesque_400Regular, BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque";
import { IBMPlexMono_400Regular, IBMPlexMono_400Regular_Italic } from "@expo-google-fonts/ibm-plex-mono";
import { IBMPlexSans_400Regular, IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import { JetBrainsMono_400Regular, JetBrainsMono_400Regular_Italic } from "@expo-google-fonts/jetbrains-mono";
import { SourceSans3_400Regular, SourceSans3_700Bold } from "@expo-google-fonts/source-sans-3";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect, useMemo } from "react";
import { ArchiveProvider } from "@/lib/archive";
import { FavoritesProvider } from "@/lib/favorites";
import { LocaleProvider, useLocale } from "@/lib/i18n";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

SplashScreen.preventAutoHideAsync();

// The splash screen stays up until the theme is read (ThemeProvider) and the fonts are loaded (RootNavigator).
export default function RootLayout() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <RootNavigator />
      </LocaleProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const { t, a } = useLocale();
  const [loaded, error] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_400Regular_Italic,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_700Bold,
    SourceSans3_400Regular,
    SourceSans3_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    InstrumentSerif_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_400Regular_Italic,
  });

  const navigationTheme = useMemo(() => {
    const base = theme.light ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.crimsonGlow,
        background: theme.colors.bgPrimary,
        card: theme.colors.bgSecondary,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.crimsonGlow,
      },
    };
  }, [theme.light, theme.colors]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.bgPrimary).catch(() => {});
  }, [theme.colors.bgPrimary]);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={theme.light ? "dark" : "light"} />
      <SessionProvider>
        <FavoritesProvider>
          <ArchiveProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.colors.bgSecondary },
                headerTintColor: theme.colors.textPrimary,
                headerTitleStyle: { fontFamily: theme.fonts.displayBold },
                contentStyle: { backgroundColor: theme.colors.bgPrimary },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="cocktail/[slug]" options={{ title: "" }} />
              <Stack.Screen name="u/[username]" options={{ title: "" }} />
              <Stack.Screen name="logs/index" options={{ title: t.logsPage.title }} />
              <Stack.Screen name="logs/new" options={{ title: t.logsPage.newTitle }} />
              <Stack.Screen name="logs/[id]" options={{ title: t.logsPage.editMeta }} />
              <Stack.Screen name="log/[id]" options={{ title: a.tabs.logEntry }} />
              <Stack.Screen name="recipes/[slug]" options={{ title: "" }} />
              <Stack.Screen name="my-recipes/index" options={{ title: t.recipesPage.title }} />
              <Stack.Screen name="my-recipes/new" options={{ title: t.recipesPage.newMeta }} />
              <Stack.Screen name="my-recipes/[id]" options={{ title: t.recipesPage.editMeta }} />
              <Stack.Screen name="what-can-i-make" options={{ title: t.whatCanIMake.title }} />
              <Stack.Screen name="welcome" options={{ title: t.welcome.title }} />
            </Stack>
          </ArchiveProvider>
        </FavoritesProvider>
      </SessionProvider>
    </NavigationThemeProvider>
  );
}
