import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import AccountView from "@/components/AccountView";
import { Button } from "@/components/Form";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import SignIn from "@/components/SignIn";
import ThemePicker from "@/components/ThemePicker";
import { Body, Heading } from "@/components/Type";
import { forgetSignInRequest, leaveAfterSignIn } from "@/lib/after-sign-in";
import { signOutOfGoogle } from "@/lib/native-auth";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { readable, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";

/** The Hesap tab: sign-in, onboarding's way in, or the account (the site's /login, /welcome, /account). */
export default function AccountScreen() {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const session = useSession();

  // Straight after sign-in, a member without a profile goes to onboarding once;
  // a member with one goes back to where they were (or the archive). A session
  // restored at launch ("loading" → "ok") stays put.
  const sentToWelcome = useRef(false);
  const previous = useRef(session.state);
  useEffect(() => {
    const was = previous.current;
    previous.current = session.state;
    if (session.state === "onboarding" && !sentToWelcome.current) {
      sentToWelcome.current = true;
      router.push("/welcome");
    }
    if (session.state === "ok" && was === "signed-out") leaveAfterSignIn();
    if (session.state === "signed-out") sentToWelcome.current = false;
  }, [session.state]);

  // Leaving the tab still signed out drops the recipe (and heart) that sent the visitor here.
  const state = useRef(session.state);
  state.current = session.state;
  useFocusEffect(
    useCallback(
      () => () => {
        if (state.current === "signed-out") forgetSignInRequest();
      },
      []
    )
  );

  if (session.state === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.textMuted} />
      </View>
    );
  }

  return (
    <KeyboardScrollView style={styles.screen}>
        {session.state === "signed-out" && (
          <>
            <SignIn />
            <View style={styles.picker}>
              <ThemePicker />
            </View>
          </>
        )}
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
    </KeyboardScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: t.colors.bgPrimary },
  card: { padding: 24, ...readable },
  title: { fontSize: 26, marginBottom: 8 },
  text: { color: t.colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  actions: { gap: 12 },
  picker: { padding: 24, paddingTop: 0, ...readable },
});
