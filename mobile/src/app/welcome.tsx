import { Redirect, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { PRIVACY_NOTICE_VERSION } from "@shared/account-config";
import { checkProfile, DISPLAY_NAME_MAX, profileError, suggestUsername } from "@shared/profile";
import { Button, Checkbox, Field, Message } from "@/components/Form";
import { Body, Heading, Mono } from "@/components/Type";
import { nameOf, useSession } from "@/lib/session";
import { SITE_URL, supabase } from "@/lib/supabase";
import { colors, readable } from "@/lib/theme";

/** The site's /welcome: the 18+ confirmation and privacy notice first, then the profile (ADR-014). */
export default function WelcomeScreen() {
  const session = useSession();
  if (session.state === "signed-out") return <Redirect href="/account" />;
  if (session.state === "ok") return <Redirect href="/account" />;
  if (session.state === "loading") return null;
  return <OnboardingForm userId={session.user.id} name={nameOf(session.user)} reload={session.reload} />;
}

function OnboardingForm({ userId, name, reload }: { userId: string; name: string; reload: () => Promise<void> }) {
  const [username, setUsername] = useState(suggestUsername(name));
  const [displayName, setDisplayName] = useState(name.slice(0, DISPLAY_NAME_MAX));
  const [adult, setAdult] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!adult) return setError("Devam etmek için 18 yaşından büyük olmalısın.");
    if (!privacy) return setError("Devam etmek için aydınlatma metnini onayla.");
    const fields = checkProfile({ username, displayName });
    if ("error" in fields) return setError(fields.error);

    setPending(true);
    // The settings row may exist from an attempt that failed on the username.
    const { error: settingsError } = await supabase
      .from("account_settings")
      .upsert({ user_id: userId, privacy_notice_version: PRIVACY_NOTICE_VERSION }, { onConflict: "user_id", ignoreDuplicates: true });
    if (settingsError) {
      setPending(false);
      return setError(`Kaydedilemedi: ${settingsError.message}`);
    }

    const { error } = await supabase
      .from("profiles")
      .insert({ id: userId, username: fields.username, display_name: fields.displayName });
    if (error) {
      setPending(false);
      return setError(profileError(error.code, error.message));
    }

    await reload();
    if (router.canGoBack()) router.back();
    else router.replace("/account");
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Heading style={styles.title}>Hoş geldin</Heading>
        <Body style={styles.subtitle}>
          Son bir adım: herkesin göreceği adını seç. Bunları sonra hesabından değiştirebilirsin.
        </Body>

        <View style={styles.stack}>
          <Field
            label="Kullanıcı adı"
            prefix="@"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase())}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            hint="3–20 karakter: küçük harf, rakam, alt çizgi."
          />
          <Field label="Görünen ad" value={displayName} onChangeText={setDisplayName} maxLength={DISPLAY_NAME_MAX} />

          <View style={styles.consents}>
            <Checkbox checked={adult} onChange={setAdult} label="18 yaşından büyüğüm.">
              <Mono style={styles.consent}>18 yaşından büyüğüm.</Mono>
            </Checkbox>
            <Checkbox checked={privacy} onChange={setPrivacy} label="Aydınlatma metnini okudum.">
              <Mono style={styles.consent}>
                <Mono style={[styles.consent, styles.link]} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy`)}>
                  Aydınlatma metnini
                </Mono>{" "}
                okudum.
              </Mono>
            </Checkbox>
          </View>

          {error && <Message error>{error}</Message>}
          <Button title="Hesabımı oluştur" onPress={submit} pending={pending} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48, ...readable },
  title: { fontSize: 26, marginBottom: 8 },
  subtitle: { color: colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  stack: { gap: 16 },
  consents: { gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 12 },
  consent: { fontSize: 12, lineHeight: 18, color: colors.textSecondary },
  link: { textDecorationLine: "underline" },
});
