import { Image } from "expo-image";
import { Stack, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Leaf, Pencil } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Avatar from "@/components/Avatar";
import CocktailReviews from "@/components/CocktailReviews";
import { Message, Notice } from "@/components/Form";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import { FavoriteButton, LogButton, RecipeButtons, ShareButton } from "@/components/RecipeActions";
import RecipeDetails from "@/components/RecipeDetails";
import ReportButton from "@/components/ReportButton";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { fetchRecipe, type Cocktail } from "@/lib/content";
import { useFavorites } from "@/lib/favorites";
import { useSession } from "@/lib/session";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";

/** A member's recipe — the site's /recipes/{slug} (RecipeView) as a screen (ADR-018). */
export default function RecipeScreen() {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const session = useSession();
  const { favorites, toggle, savedOnSignIn } = useFavorites();
  const [recipe, setRecipe] = useState<Cocktail | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRecipe(await fetchRecipe(slug));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [slug]);

  // Again whenever the screen comes back: the author may have edited it.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (recipe === undefined) {
    return (
      <View style={styles.center}>
        {failed ? (
          <Pressable onPress={load}>
            <Mono style={styles.link}>{a.load.recipe}</Mono>
          </Pressable>
        ) : (
          <ActivityIndicator color={theme.colors.crimsonGlow} />
        )}
      </View>
    );
  }

  if (recipe === null) {
    return (
      <View style={styles.center}>
        <Body style={styles.muted}>{a.notFound.recipe}</Body>
      </View>
    );
  }

  const author = recipe.author;
  const isAuthor = session.state === "ok" && author?.id === session.profile.id;
  const here = { pathname: "/recipes/[slug]", params: { slug: recipe.slug } } as const;

  return (
    <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: recipe.name }} />
      <View style={[styles.accent, { backgroundColor: recipe.color }]} />
      {recipe.imageUrl && <Image source={recipe.imageUrl} style={styles.photo} contentFit="cover" />}

      <View style={styles.body}>
        <Label style={styles.eyebrow}>{t.cocktails.memberRecipe}</Label>
        <View style={styles.metaRow}>
          <Label style={styles.meta}>{[recipe.baseAlcohol, recipe.flavor, recipe.glass].filter(Boolean).join(" · ")}</Label>
          {recipe.vegan && (
            <View style={styles.vegan}>
              <Leaf size={10} color={theme.colors.vegan} />
              <Label style={styles.veganText}>{t.cocktails.vegan}</Label>
            </View>
          )}
        </View>
        <View style={styles.nameRow}>
          <Heading style={styles.name}>{recipe.name}</Heading>
          <FavoriteButton
            on={favorites.has(recipe.id)}
            onPress={async () => {
              setFavoriteError(null);
              setFavoriteError(await toggle(recipe.id, here));
            }}
          />
        </View>
        <RecipeButtons>
          <LogButton slug={recipe.slug} from={here} />
          <ShareButton name={recipe.name} path={`/recipes/${recipe.slug}`} />
        </RecipeButtons>
        {favoriteError && <Message error>{favoriteError}</Message>}
        {savedOnSignIn === recipe.id && <Notice>{a.recipe.savedToFavorites}</Notice>}
        {recipe.subtitle ? <Body style={styles.subtitle}>{recipe.subtitle}</Body> : null}

        {author && (
          <View style={styles.authorRow}>
            <Pressable
              onPress={() => router.push({ pathname: "/u/[username]", params: { username: author.username } })}
              style={styles.author}
              accessibilityRole="link"
              accessibilityLabel={`Tarif: ${author.displayName}`}
            >
              <Avatar path={author.avatarPath} name={author.displayName} size={28} />
              <Body style={styles.authorText} numberOfLines={1}>
                <Body style={styles.by}>tarif: </Body>
                <Body style={styles.authorName}>{author.displayName}</Body>
                <Mono style={styles.username}> @{author.username}</Mono>
              </Body>
            </Pressable>
            {isAuthor ? (
              <Pressable
                onPress={() => router.push({ pathname: "/my-recipes/[id]", params: { id: recipe.id } })}
                hitSlop={8}
                style={styles.edit}
                accessibilityRole="button"
                accessibilityLabel={t.recipesPage.editMeta}
              >
                <Pencil size={11} color={theme.colors.crimsonGlow} />
                <Mono style={styles.editText}>{t.common.edit}</Mono>
              </Pressable>
            ) : (
              <ReportButton targetType="cocktail" targetId={recipe.id} ownerId={author.id} label={t.cocktails.reportRecipe} />
            )}
          </View>
        )}

        <View style={styles.details}>
          <RecipeDetails cocktail={recipe} />
        </View>

        <CocktailReviews cocktail={recipe} onChanged={load} />
      </View>
    </KeyboardScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgSecondary },
  content: { paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bgPrimary },
  muted: { color: t.colors.textSecondary },
  link: { fontSize: 12, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  accent: { height: 4 },
  photo: { width: "100%", aspectRatio: 16 / 9, backgroundColor: t.colors.bgElevated },
  body: { padding: 24 },
  eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 10 },
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
  subtitle: { marginTop: 8, fontSize: 14 },
  authorRow: { marginTop: 18, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  author: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1, marginRight: "auto" },
  authorText: { flexShrink: 1, fontSize: 14 },
  by: { fontSize: 14, color: t.colors.textMuted },
  authorName: { fontSize: 14, fontFamily: t.fonts.sansBold },
  username: { fontSize: 11, color: t.colors.textMuted },
  edit: { flexDirection: "row", alignItems: "center", gap: 4 },
  editText: { fontSize: 11, color: t.colors.crimsonGlow, textDecorationLine: "underline" },
  details: { marginTop: 32 },
});
