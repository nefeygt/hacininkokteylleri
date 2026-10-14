import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { Leaf } from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";
import RecipeDetails from "@/components/RecipeDetails";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { useArchive } from "@/lib/archive";
import { colors } from "@/lib/theme";

/** One house recipe — the site's recipe card (/cocktails?cocktail={slug}) as a screen. */
export default function CocktailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const cocktail = useArchive().archive?.cocktails.find((c) => c.slug === slug);

  if (!cocktail) {
    return (
      <View style={styles.center}>
        <Body style={{ color: colors.textSecondary }}>Bu kokteyl bulunamadı.</Body>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
        <Heading style={styles.name}>{cocktail.name}</Heading>
        <Mono style={styles.subtitle}>{cocktail.subtitle}</Mono>

        <View style={styles.details}>
          <RecipeDetails cocktail={cocktail} />
        </View>
      </View>
    </ScrollView>
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
  name: { fontSize: 24 },
  subtitle: { marginTop: 4, fontSize: 14 },
  details: { marginTop: 32 },
});
