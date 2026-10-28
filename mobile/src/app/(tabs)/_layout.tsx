import { Tabs } from "expo-router";
import { BookOpen, Newspaper, UserRound } from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";

// The site's navbar as tabs: Kokteyller (the archive), Akış (the feed), Hesap.
export default function TabLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.bgSecondary },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: { fontFamily: theme.fonts.displayBold },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: theme.colors.bgSecondary, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.crimsonGlow,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontFamily: theme.fonts.mono, fontSize: 10 },
        sceneStyle: { backgroundColor: theme.colors.bgPrimary },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Kokteyller", headerTitle: "haci", tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: "Akış", tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: "Hesap", tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }}
      />
    </Tabs>
  );
}
