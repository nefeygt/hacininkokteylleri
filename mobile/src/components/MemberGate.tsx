import type { Href } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import type { Writer } from "@/lib/community";
import { useSession, type Settings } from "@/lib/session";
import { type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { Button } from "./Form";
import { Body } from "./Type";
import { useLocale } from "@/lib/i18n";

/**
 * A screen only members use (the site's requireMember): a visitor without a
 * profile is offered the Hesap tab and comes back to `from` afterwards (ADR-022).
 * `feature` names what needs the account ("İçki günlüğü", "Tarif yazmak").
 */
export default function MemberGate({
  from,
  feature = "logs",
  children,
}: {
  from: Href;
  feature?: "logs" | "recipes";
  children: (writer: Writer, settings: Settings) => ReactNode;
}) {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const session = useSession();

  if (session.state === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.crimsonGlow} />
      </View>
    );
  }

  if (session.state !== "ok") {
    const onboarding = session.state === "onboarding";
    return (
      <View style={styles.center}>
        <Body style={styles.text}>
          {a.gate[`${feature}${onboarding ? "Finish" : "SignIn"}`]}
        </Body>
        <Button title={onboarding ? a.account.completeProfile : t.login.signIn} onPress={() => askToSignIn(from)} />
      </View>
    );
  }

  return <>{children({ id: session.profile.id, username: session.profile.username }, session.settings)}</>;
}

const makeStyles = (t: Theme) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: t.colors.bgPrimary },
  text: { textAlign: "center", color: t.colors.textSecondary },
});
