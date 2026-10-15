import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { supabase } from "./supabase";

// Native sign-in: the provider's own sheet gives an ID token, Supabase Auth
// checks it and opens a session (ADR-020). No browser round trip.

/** OAuth client IDs from Google Cloud "haci-511515" — public by design (mobile/.env). */
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export type NativeSignInResult = { ok: true } | { cancelled: true } | { error: string };

/** Google needs the native module: a development or store build, not Expo Go or the web. */
export const googleAvailable = Platform.OS !== "web" && !!GOOGLE_WEB_CLIENT_ID;

let googleConfigured = false;

export async function signInWithGoogle(): Promise<NativeSignInResult> {
  try {
    // Loaded on demand: in Expo Go the native module is missing and importing it throws.
    const google = require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = google;

    if (!googleConfigured) {
      // The ID token's audience is the web client, which Supabase's Google provider already trusts;
      // on iOS it is the iOS client, listed in Supabase as an extra client ID.
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
      googleConfigured = true;
    }

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return { cancelled: true };
      const token = response.data.idToken;
      if (!token) return { error: "Google bir kimlik vermedi. Tekrar dene." };

      const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token });
      if (error) return { error: "Google ile giriş tamamlanamadı. Tekrar dene." };
      return { ok: true };
    } catch (e) {
      if (isErrorWithCode(e) && (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS)) {
        return { cancelled: true };
      }
      if (isErrorWithCode(e) && e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { error: "Bu cihazda Google Play hizmetleri yok." };
      }
      return { error: "Google ile giriş tamamlanamadı. Tekrar dene." };
    }
  } catch {
    return { error: "Google ile giriş bu sürümde çalışmıyor." };
  }
}

/** Forgets the chosen Google account, so the next sign-in asks again. */
export async function signOutOfGoogle(): Promise<void> {
  if (!googleAvailable) return;
  try {
    const { GoogleSignin } = require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin");
    await GoogleSignin.signOut();
  } catch {
    // Not signed in with Google, or the module is missing.
  }
}

/** Sign in with Apple: iOS only (App Store rule 4.8 asks for it next to Google). */
export async function appleAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<NativeSignInResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return { error: "Apple bir kimlik vermedi. Tekrar dene." };

    const { error } = await supabase.auth.signInWithIdToken({ provider: "apple", token: credential.identityToken });
    if (error) return { error: "Apple ile giriş tamamlanamadı. Tekrar dene." };

    // Apple shares the name only on the first sign-in; keep it for onboarding's suggestions.
    const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(" ");
    if (name) await supabase.auth.updateUser({ data: { full_name: name } });
    return { ok: true };
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ERR_REQUEST_CANCELED") return { cancelled: true };
    return { error: "Apple ile giriş tamamlanamadı. Tekrar dene." };
  }
}
