import { Inter_400Regular, Inter_700Bold } from "@expo-google-fonts/inter";
import { JetBrainsMono_400Regular, JetBrainsMono_400Regular_Italic } from "@expo-google-fonts/jetbrains-mono";
import { useFonts } from "expo-font";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ArchiveProvider } from "@/lib/archive";
import { SessionProvider } from "@/lib/session";
import { colors, fonts } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.crimsonGlow,
    background: colors.bgPrimary,
    card: colors.bgSecondary,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.crimsonGlow,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_400Regular_Italic,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <SessionProvider>
        <ArchiveProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bgSecondary },
              headerTintColor: colors.textPrimary,
              headerTitleStyle: { fontFamily: fonts.sansBold },
              contentStyle: { backgroundColor: colors.bgPrimary },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="cocktail/[slug]" options={{ title: "" }} />
            <Stack.Screen name="welcome" options={{ title: "Hoş geldin" }} />
          </Stack>
        </ArchiveProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
