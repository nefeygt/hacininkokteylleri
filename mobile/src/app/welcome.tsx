import { Redirect } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { PRIVACY_NOTICE_VERSION } from "@shared/account-config";
import { checkProfile, DISPLAY_NAME_MAX, profileError, suggestUsername } from "@shared/profile";
import { Button, Checkbox, Field, Message } from "@/components/Form";
import KeyboardScrollView from "@/components/KeyboardScrollView";
import { Body, Heading, Mono } from "@/components/Type";
import { leaveAfterSignIn } from "@/lib/after-sign-in";
import { nameOf, useSession } from "@/lib/session";
import { SITE_URL, supabase } from "@/lib/supabase";
import { readable, type Theme } from "@/lib/theme";
import { useStyles } from "@/lib/theme-context";
import { localePath } from "@shared/i18n/locales";
import { useLocale } from "@/lib/i18n";

/** The site's /welcome: the 18+ confirmation and privacy notice first, then the profile (ADR-014). */
export default function WelcomeScreen() {
  const session = useSession();
  if (session.state === "signed-out") return <Redirect href="/account" />;
  if (session.state === "ok") return <Redirect href="/account" />;
  if (session.state === "loading") return null;
  return <OnboardingForm userId={session.user.id} name={nameOf(session.user)} reload={session.reload} />;
}

function OnboardingForm({ userId, name, reload }: { userId: string; name: string; reload: () => Promise<void> }) {
  const { t, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const [username, setUsername] = useState(suggestUsername(name));
  const [displayName, setDisplayName] = useState(name.slice(0, DISPLAY_NAME_MAX));
  const [adult, setAdult] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!adult) return setError(t.actions.adultRequired);
    if (!privacy) return setError(t.actions.privacyRequired);
    const fields = checkProfile({ username, displayName }, t.validation);
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
      return setError(profileError(error.code, error.message, t.validation));
    }

    // The Hesap tab now holds the account; the member goes back to where they were.
    leaveAfterSignIn();
    await reload();
  }

  return (
    <KeyboardScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Heading style={styles.title}>{t.welcome.title}</Heading>
        <Body style={styles.subtitle}>
          {t.welcome.subtitle}
        </Body>

        <View style={styles.stack}>
          <Field
            label={t.welcome.username}
            prefix="@"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase())}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            hint={t.welcome.usernameHint}
          />
          <Field label={t.welcome.displayName} value={displayName} onChangeText={setDisplayName} maxLength={DISPLAY_NAME_MAX} />

          <View style={styles.consents}>
            <Checkbox checked={adult} onChange={setAdult} label={t.welcome.adult}>
              <Mono style={styles.consent}>{t.welcome.adult}</Mono>
            </Checkbox>
            <Checkbox checked={privacy} onChange={setPrivacy} label={`${t.welcome.privacyPrefix}${t.welcome.privacyLink}${t.welcome.privacySuffix}`}>
              <Mono style={styles.consent}>
                {t.welcome.privacyPrefix}
                <Mono style={[styles.consent, styles.link]} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}${localePath(locale, "/privacy")}`)}>
                  {t.welcome.privacyLink}
                </Mono>
                {t.welcome.privacySuffix}
              </Mono>
            </Checkbox>
          </View>

          {error && <Message error>{error}</Message>}
          <Button title={t.welcome.submit} onPress={submit} pending={pending} />
        </View>
    </KeyboardScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.colors.bgPrimary },
  content: { padding: 24, paddingBottom: 48, ...readable },
  title: { fontSize: 26, marginBottom: 8 },
  subtitle: { color: t.colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  stack: { gap: 16 },
  consents: { gap: 12, borderWidth: 1, borderColor: t.colors.border, borderRadius: 4, padding: 12 },
  consent: { fontSize: 12, lineHeight: 18, color: t.colors.textSecondary },
  link: { textDecorationLine: "underline" },
});
