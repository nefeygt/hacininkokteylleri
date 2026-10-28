import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { authErrorMessage, MIN_PASSWORD_LENGTH } from "@shared/account-config";
import { appleAvailable, googleAvailable, signInWithApple, signInWithGoogle, type NativeSignInResult } from "@/lib/native-auth";
import { SITE_URL, supabase } from "@/lib/supabase";
import { readable, type Theme } from "@/lib/theme";
import { useStyles } from "@/lib/theme-context";
import { Button, Divider, Field, Message, Notice } from "./Form";
import { Body, Heading, Label, Mono } from "./Type";
import { localePath } from "@shared/i18n/locales";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";

type Mode = "sign-in" | "sign-up" | "forgot";

// Supabase answers the same way for an address that already has an account
// (so nobody can probe which addresses are members); the text says so.
/**
 * The site's /login for the app. E-mail links (sign-up confirmation, password
 * reset) open the website, as on the web; after confirming, the member signs
 * in here (ADR-020).
 */
export default function SignIn() {
  const { t, a, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const [error, setError] = useState<string | null>(null);
  const [nativePending, setNativePending] = useState<"google" | "apple" | null>(null);
  const [apple, setApple] = useState(false);

  useEffect(() => {
    appleAvailable().then(setApple).catch(() => setApple(false));
  }, []);

  async function native(provider: "google" | "apple", run: () => Promise<NativeSignInResult>) {
    setNativePending(provider);
    setError(null);
    const result = await run();
    setNativePending(null);
    if ("error" in result) setError(result.error);
    // On success the session provider hears about it and the screen changes.
  }

  return (
    <View style={styles.card}>
      <Label style={styles.eyebrow}>{a.tabs.account}</Label>
      <Heading style={styles.title}>{t.login.title}</Heading>
      <Body style={styles.subtitle}>
        {t.login.subtitle}
      </Body>

      <View style={styles.stack}>
        {error && <Message error>{error}</Message>}
        {apple && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={4}
            style={styles.apple}
            onPress={() => native("apple", signInWithApple)}
          />
        )}
        {googleAvailable && (
          <Button
            kind="secondary"
            title={t.login.google}
            pending={nativePending === "google"}
            disabled={nativePending !== null}
            onPress={() => native("google", signInWithGoogle)}
          />
        )}
        {(apple || googleAvailable) && <Divider label={t.login.or} />}
        <EmailForm />
        <Mono style={styles.legal}>
          {t.login.continuePrefix}
          <Mono style={styles.link} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}${localePath(locale, "/privacy")}`)}>
            {t.login.privacyLink}
          </Mono>
          {t.login.continueSuffix}
        </Mono>
      </View>
    </View>
  );
}

function EmailForm() {
  const { t, a, locale } = useLocale();
  const styles = useStyles(makeStyles);
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  function switchTo(target: Mode) {
    setMode(target);
    setError(null);
    setSent(null);
  }

  /** E-mail links land on the website's callback, as for sign-ups made there. */
  function callback(destination: string) {
    return `${SITE_URL}/auth/callback?via=email&next=${encodeURIComponent(destination)}`;
  }

  async function submit() {
    setPending(true);
    setError(null);
    setSent(null);
    const address = email.trim();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email: address, password });
      if (error) setError(authErrorMessage(error.message, t.auth));
      // On success the session provider moves on (onboarding or the account).
    } else if (mode === "sign-up") {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(format(t.auth.passwordShort, { min: MIN_PASSWORD_LENGTH }));
      } else {
        const { error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: callback(localePath(locale, "/account")) },
        });
        if (error) setError(authErrorMessage(error.message, t.auth));
        else {
          // Back to sign-in with the address filled in: the next step happens here.
          setMode("sign-in");
          setSent(a.signIn.signUpSent);
        }
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: callback(localePath(locale, "/reset-password")) });
      if (error) setError(authErrorMessage(error.message, t.auth));
      else setSent(a.signIn.resetSent);
    }
    setPending(false);
  }

  return (
    <View style={styles.stack}>
      <Field
        label={t.login.email}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        inputMode="email"
      />
      {mode !== "forgot" && (
        <Field
          label={t.login.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          textContentType={mode === "sign-up" ? "newPassword" : "password"}
          hint={mode === "sign-up" ? `En az ${MIN_PASSWORD_LENGTH} karakter.` : undefined}
          onSubmitEditing={submit}
        />
      )}

      {error && <Message error>{error}</Message>}
      {sent && <Notice>{sent}</Notice>}

      <Button title={{ "sign-in": t.login.signIn, "sign-up": t.login.signUp, forgot: t.login.forgot }[mode]} onPress={submit} pending={pending} disabled={!email.trim() || (mode !== "forgot" && !password)} />

      <View style={styles.switches}>
        {mode === "sign-in" ? (
          <>
            <Button kind="link" title={t.login.noAccount} onPress={() => switchTo("sign-up")} />
            <Button kind="link" title={t.login.forgotLink} onPress={() => switchTo("forgot")} />
          </>
        ) : (
          <Button kind="link" title={t.login.backToSignIn} onPress={() => switchTo("sign-in")} />
        )}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  card: { padding: 24, ...readable },
  eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 6 },
  title: { fontSize: 26, marginBottom: 8 },
  subtitle: { color: t.colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  stack: { gap: 16 },
  apple: { height: 44 },
  switches: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  legal: { fontSize: 11, lineHeight: 17, color: t.colors.textMuted },
  link: { fontSize: 11, color: t.colors.textMuted, textDecorationLine: "underline" },
});
