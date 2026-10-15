import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Heart, Leaf, NotebookPen } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import CocktailReviews from "@/components/CocktailReviews";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import { Message, Notice } from "@/components/Form";
import RecipeDetails from "@/components/RecipeDetails";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { askToSignIn } from "@/lib/after-sign-in";
import { useArchive } from "@/lib/archive";
import { useFavorites } from "@/lib/favorites";
import { useSession } from "@/lib/session";
import { alpha, colors } from "@/lib/theme";

/** One house recipe — the site's recipe card (/cocktails?cocktail={slug}) as a screen. */
export default function CocktailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { archive, refresh } = useArchive();
  const { favorites, toggle, savedOnSignIn } = useFavorites();
  const session = useSession();
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const cocktail = archive?.cocktails.find((c) => c.slug === slug);

  if (!archive) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.crimsonGlow} />
      </View>
    );
  }

  if (!cocktail) {
    return (
      <View style={styles.center}>
        <Body style={{ color: colors.textSecondary }}>Bu kokteyl bulunamadı.</Body>
      </View>
    );
  }

  return (
    <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: cocktail.name }} />
      <View style={[styles.accent, { backgroundColor: cocktail.color }]} />
      {cocktail.imageUrl && <Image source={cocktail.imageUrl} style={styles.photo} contentFit="cover" />}

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Label style={styles.meta}>
            {cocktail.baseAlcohol} · {cocktail.flavor} · {cocktail.glass}
          </Label>
          {cocktail.vegan && (
            <View style={styles.vegan}>
              <Leaf size={10} color={colors.vegan} />
              <Label style={styles.veganText}>Vegan</Label>
            </View>
          )}
        </View>
        <View style={styles.nameRow}>
          <Heading style={styles.name}>{cocktail.name}</Heading>
          <FavoriteButton
            on={favorites.has(cocktail.id)}
            onPress={async () => {
              setFavoriteError(null);
              setFavoriteError(await toggle(cocktail.id, { pathname: "/cocktail/[slug]", params: { slug: cocktail.slug } }));
            }}
          />
        </View>
        <LogButton
          onPress={() => {
            const form = { pathname: "/logs/new", params: { cocktail: cocktail.slug } } as const;
            // A visitor signs in first and comes back to the recipe (ADR-022), then taps again.
            if (session.state === "ok") router.push(form);
            else askToSignIn({ pathname: "/cocktail/[slug]", params: { slug: cocktail.slug } });
          }}
        />
        {favoriteError && <Message error>{favoriteError}</Message>}
        {savedOnSignIn === cocktail.id && <Notice>Favorilerine eklendi.</Notice>}
        <Mono style={styles.subtitle}>{cocktail.subtitle}</Mono>

        <View style={styles.details}>
          <RecipeDetails cocktail={cocktail} />
        </View>

        <CocktailReviews cocktail={cocktail} onChanged={refresh} />
      </View>
    </KeyboardScrollView>
  );
}

/** The heart next to the name (the site's RecipeActions); a visitor without a profile goes to the Hesap tab. */
function FavoriteButton({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[styles.heart, on && styles.heartOn]}
      accessibilityRole="button"
      accessibilityLabel={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      accessibilityState={{ selected: on }}
    >
      <Heart size={16} color={on ? colors.crimsonGlow : colors.textMuted} fill={on ? colors.crimsonGlow : "transparent"} />
    </Pressable>
  );
}

/** "Günlüğe ekle" (the site's RecipeActions link): the drink log form, started from this recipe. */
function LogButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={styles.log} accessibilityRole="button" accessibilityLabel="Günlüğe ekle">
      <NotebookPen size={13} color={colors.textMuted} />
      <Mono style={styles.logText}>Günlüğe ekle</Mono>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgSecondary },
  content: { paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgPrimary },
  accent: { height: 4 },
  photo: { width: "100%", aspectRatio: 16 / 9, backgroundColor: colors.bgElevated },
  body: { padding: 24 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  meta: { letterSpacing: 2 },
  vegan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(20, 83, 45, 0.3)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  veganText: { fontSize: 9, color: colors.vegan, letterSpacing: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1, fontSize: 24 },
  heart: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgElevated },
  heartOn: { backgroundColor: alpha(colors.crimson, 0.2) },
  log: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 10,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 12,
    backgroundColor: colors.bgElevated,
  },
  logText: { fontSize: 11, color: colors.textMuted },
  subtitle: { marginTop: 4, fontSize: 14 },
  details: { marginTop: 32 },
});
