import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { authErrorMessage, MIN_PASSWORD_LENGTH } from "@shared/account-config";
import { appleAvailable, googleAvailable, signInWithApple, signInWithGoogle, type NativeSignInResult } from "@/lib/native-auth";
import { SITE_URL, supabase } from "@/lib/supabase";
import { colors, readable } from "@/lib/theme";
import { Button, Divider, Field, Message, Notice } from "./Form";
import { Body, Heading, Label, Mono } from "./Type";

type Mode = "sign-in" | "sign-up" | "forgot";

// Supabase answers the same way for an address that already has an account
// (so nobody can probe which addresses are members); the text says so.
const SIGN_UP_SENT = [
  "Onay e-postasını gönderdik.",
  "1. E-postanı aç. Gelmediyse Gereksiz/Spam klasörüne bak.",
  "2. Bağlantıya tıkla. Site açılır; orada başka bir şey yapman gerekmez.",
  "3. Buraya dönüp aynı e-posta ve şifreyle giriş yap.",
  "Bu adresle zaten bir hesap varsa e-posta gelmez: giriş yap ya da şifreni sıfırla.",
].join("\n");

const RESET_SENT = [
  "Bu adresle bir hesap varsa şifre sıfırlama bağlantısını gönderdik.",
  "1. E-postanı aç. Gelmediyse Gereksiz/Spam klasörüne bak.",
  "2. Bağlantıya tıkla ve yeni şifreni sitede belirle.",
  "3. Buraya dönüp yeni şifrenle giriş yap.",
].join("\n");

const TITLES: Record<Mode, string> = {
  "sign-in": "Giriş yap",
  "sign-up": "Hesap oluştur",
  forgot: "Sıfırlama bağlantısı gönder",
};

/**
 * The site's /login for the app. E-mail links (sign-up confirmation, password
 * reset) open the website, as on the web; after confirming, the member signs
 * in here (ADR-020).
 */
export default function SignIn() {
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
      <Label style={styles.eyebrow}>Hesap</Label>
      <Heading style={styles.title}>Giriş yap</Heading>
      <Body style={styles.subtitle}>
        Yorum yazmak, favorilerini ve içtiklerini kaydetmek için bir hesap aç ya da giriş yap.
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
            title="Google ile devam et"
            pending={nativePending === "google"}
            disabled={nativePending !== null}
            onPress={() => native("google", signInWithGoogle)}
          />
        )}
        {(apple || googleAvailable) && <Divider label="ya da" />}
        <EmailForm />
        <Mono style={styles.legal}>
          Devam ederek{" "}
          <Mono style={styles.link} onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy`)}>
            aydınlatma metnini
          </Mono>{" "}
          okumuş olursun. Hesap açmak için 18 yaşından büyük olmalısın.
        </Mono>
      </View>
    </View>
  );
}

function EmailForm() {
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
      if (error) setError(authErrorMessage(error.message));
      // On success the session provider moves on (onboarding or the account).
    } else if (mode === "sign-up") {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setError(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`);
      } else {
        const { error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: callback("/account") },
        });
        if (error) setError(authErrorMessage(error.message));
        else {
          // Back to sign-in with the address filled in: the next step happens here.
          setMode("sign-in");
          setSent(SIGN_UP_SENT);
        }
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: callback("/reset-password") });
      if (error) setError(authErrorMessage(error.message));
      else setSent(RESET_SENT);
    }
    setPending(false);
  }

  return (
    <View style={styles.stack}>
      <Field
        label="E-posta"
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
          label="Şifre"
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

      <Button title={TITLES[mode]} onPress={submit} pending={pending} disabled={!email.trim() || (mode !== "forgot" && !password)} />

      <View style={styles.switches}>
        {mode === "sign-in" ? (
          <>
            <Button kind="link" title="Hesabın yok mu? Oluştur" onPress={() => switchTo("sign-up")} />
            <Button kind="link" title="Şifremi unuttum" onPress={() => switchTo("forgot")} />
          </>
        ) : (
          <Button kind="link" title="Giriş yapmaya dön" onPress={() => switchTo("sign-in")} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, ...readable },
  eyebrow: { color: colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 6 },
  title: { fontSize: 26, marginBottom: 8 },
  subtitle: { color: colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  stack: { gap: 16 },
  apple: { height: 44 },
  switches: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  legal: { fontSize: 11, lineHeight: 17, color: colors.textMuted },
  link: { fontSize: 11, color: colors.textMuted, textDecorationLine: "underline" },
});
