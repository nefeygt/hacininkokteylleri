import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import AccountView from "@/components/AccountView";
import { Button } from "@/components/Form";
import SignIn from "@/components/SignIn";
import { Body, Heading } from "@/components/Type";
import { signOutOfGoogle } from "@/lib/native-auth";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors, readable } from "@/lib/theme";

/** The Hesap tab: sign-in, onboarding's way in, or the account (the site's /login, /welcome, /account). */
export default function AccountScreen() {
  const session = useSession();

  // Straight after sign-in, a member without a profile goes to onboarding once.
  const sentToWelcome = useRef(false);
  useEffect(() => {
    if (session.state === "onboarding" && !sentToWelcome.current) {
      sentToWelcome.current = true;
      router.push("/welcome");
    }
    if (session.state === "signed-out") sentToWelcome.current = false;
  }, [session.state]);

  if (session.state === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.textMuted} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled">
        {session.state === "signed-out" && <SignIn />}
        {session.state === "onboarding" && (
          <View style={styles.card}>
            <Heading style={styles.title}>Son bir adım</Heading>
            <Body style={styles.text}>Kullanıcı adını seç ve 18 yaşından büyük olduğunu onayla.</Body>
            <View style={styles.actions}>
              <Button title="Profilini tamamla" onPress={() => router.push("/welcome")} />
              <Button
                kind="secondary"
                title="Çıkış yap"
                onPress={async () => {
                  await signOutOfGoogle();
                  await supabase.auth.signOut();
                }}
              />
            </View>
          </View>
        )}
        {session.state === "ok" && (
          <AccountView email={session.user.email} profile={session.profile} settings={session.settings} reload={session.reload} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bgPrimary },
  card: { padding: 24, ...readable },
  title: { fontSize: 26, marginBottom: 8 },
  text: { color: colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  actions: { gap: 12 },
});
