import type { Href } from "expo-router";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import type { Writer } from "@/lib/community";
import { useSession, type Settings } from "@/lib/session";
import { colors } from "@/lib/theme";
import { Button } from "./Form";
import { Body } from "./Type";

/**
 * A screen only members use (the site's requireMember): a visitor without a
 * profile is offered the Hesap tab and comes back to `from` afterwards (ADR-022).
 * `feature` names what needs the account ("İçki günlüğü", "Tarif yazmak").
 */
export default function MemberGate({
  from,
  feature = "İçki günlüğü",
  children,
}: {
  from: Href;
  feature?: string;
  children: (writer: Writer, settings: Settings) => ReactNode;
}) {
  const session = useSession();

  if (session.state === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.crimsonGlow} />
      </View>
    );
  }

  if (session.state !== "ok") {
    const onboarding = session.state === "onboarding";
    return (
      <View style={styles.center}>
        <Body style={styles.text}>
          {onboarding ? `${feature} için önce profilini tamamla.` : `${feature} için giriş yap.`}
        </Body>
        <Button title={onboarding ? "Profilini tamamla" : "Giriş yap"} onPress={() => askToSignIn(from)} />
      </View>
    );
  }

  return <>{children({ id: session.profile.id, username: session.profile.username }, session.settings)}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: colors.bgPrimary },
  text: { textAlign: "center", color: colors.textSecondary },
});
