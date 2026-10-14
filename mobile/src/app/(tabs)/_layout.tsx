import { Tabs } from "expo-router";
import { BookOpen, Newspaper, UserRound } from "lucide-react-native";
import { colors, fonts } from "@/lib/theme";

// The site's navbar as tabs: Kokteyller (the archive), Akış (the feed), Hesap.
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: fonts.sansBold },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.bgSecondary, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.crimsonGlow,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.mono, fontSize: 10 },
        sceneStyle: { backgroundColor: colors.bgPrimary },
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
