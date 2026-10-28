import { StyleSheet, View } from "react-native";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import MemberGate from "@/components/MemberGate";
import RecipeForm from "@/components/RecipeForm";
import { Body } from "@/components/Type";
import { NEW_RECIPE } from "@/lib/recipes";
import { readable, type Theme } from "@/lib/theme";
import { useStyles } from "@/lib/theme-context";

/** A new recipe (the site's /account/recipes/new). */
export default function NewRecipeScreen() {
  const styles = useStyles(makeStyles);
  return (
    <MemberGate from="/my-recipes/new" feature="Tarif yazmak">
      {(writer) => (
        <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <View style={readable}>
            <Body style={styles.subtitle}>Kendi tarifini yaz. Yayınladığında profilinde ve akışta görünür.</Body>
            <RecipeForm writer={writer} initial={NEW_RECIPE} />
          </View>
        </KeyboardScrollView>
      )}
    </MemberGate>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 16, paddingBottom: 48 },
  subtitle: { fontSize: 12, lineHeight: 18, color: t.colors.textMuted, marginBottom: 16 },
});
