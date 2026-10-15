import { StyleSheet, View } from "react-native";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import MemberGate from "@/components/MemberGate";
import RecipeForm from "@/components/RecipeForm";
import { Mono } from "@/components/Type";
import { NEW_RECIPE } from "@/lib/recipes";
import { colors, readable } from "@/lib/theme";

/** A new recipe (the site's /account/recipes/new). */
export default function NewRecipeScreen() {
  return (
    <MemberGate from="/my-recipes/new" feature="Tarif yazmak">
      {(writer) => (
        <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <View style={readable}>
            <Mono style={styles.subtitle}>Kendi tarifini yaz. Yayınladığında profilinde ve akışta görünür.</Mono>
            <RecipeForm writer={writer} initial={NEW_RECIPE} />
          </View>
        </KeyboardScrollView>
      )}
    </MemberGate>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 16, paddingBottom: 48 },
  subtitle: { fontSize: 12, lineHeight: 18, color: colors.textMuted, marginBottom: 16 },
});
