import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { Leaf } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import CocktailReviews from "@/components/CocktailReviews";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import { Message, Notice } from "@/components/Form";
import { FavoriteButton, LogButton } from "@/components/RecipeActions";
import RecipeDetails from "@/components/RecipeDetails";
import { Body, Heading, Label } from "@/components/Type";
import { useArchive } from "@/lib/archive";
import { useFavorites } from "@/lib/favorites";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";

/** One house recipe — the site's recipe card (/cocktails?cocktail={slug}) as a screen. */
export default function CocktailScreen() {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { archive, refresh } = useArchive();
  const { favorites, toggle, savedOnSignIn } = useFavorites();
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const cocktail = archive?.cocktails.find((c) => c.slug === slug);

  if (!archive) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.crimsonGlow} />
      </View>
    );
  }

  if (!cocktail) {
    return (
      <View style={styles.center}>
        <Body style={{ color: theme.colors.textSecondary }}>Bu kokteyl bulunamadı.</Body>
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
              <Leaf size={10} color={theme.colors.vegan} />
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
        <LogButton slug={cocktail.slug} from={{ pathname: "/cocktail/[slug]", params: { slug: cocktail.slug } }} />
        {favoriteError && <Message error>{favoriteError}</Message>}
        {savedOnSignIn === cocktail.id && <Notice>Favorilerine eklendi.</Notice>}
        <Body style={styles.subtitle}>{cocktail.subtitle}</Body>

        <View style={styles.details}>
          <RecipeDetails cocktail={cocktail} />
        </View>

        <CocktailReviews cocktail={cocktail} onChanged={refresh} />
      </View>
    </KeyboardScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgSecondary },
  content: { paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bgPrimary },
  accent: { height: 4 },
  photo: { width: "100%", aspectRatio: 16 / 9, backgroundColor: t.colors.bgElevated },
  body: { padding: 24 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  meta: { letterSpacing: 2 },
  vegan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: alpha(t.colors.veganBg, 0.3),
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  veganText: { fontSize: 9, color: t.colors.vegan, letterSpacing: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1, fontSize: 24 },
  subtitle: { marginTop: 4, fontSize: 14 },
  details: { marginTop: 32 },
});
