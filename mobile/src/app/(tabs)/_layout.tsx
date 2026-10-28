import { Tabs } from "expo-router";
import { BookOpen, Newspaper, UserRound } from "lucide-react-native";
import { useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";

// The site's navbar as tabs: Kokteyller (the archive), Akış (the feed), Hesap.
export default function TabLayout() {
  const { t, a } = useLocale();
  const theme = useTheme();
  const { unread } = useNotifications();
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
        options={{ title: t.nav.cocktails, headerTitle: "haci", tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="feed"
        options={{ title: t.nav.feed, tabBarIcon: ({ color, size }) => <Newspaper color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: a.tabs.account,
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
          // The site's dot on the account icon (ADR-030), with the count.
          tabBarBadge: unread > 0 ? (unread > 99 ? "99+" : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.crimson, color: "#fff", fontFamily: theme.fonts.mono, fontSize: 10 },
        }}
      />
    </Tabs>
  );
}
