// Push notifications on the phone (ADR-033). The database pushes every new notification to the member's
// registered devices (the Edge Function send-push-notifications); the app only registers this device's
// Expo push token, after the member turns push on — permission is never asked at launch.

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { words } from "@/lib/i18n";
import { supabase } from "./supabase";

/** Expo web has no Expo push; neither does a simulator. */
export const PUSH_SUPPORTED = (Platform.OS === "ios" || Platform.OS === "android") && Device.isDevice;

if (PUSH_SUPPORTED) {
  // A push that arrives while the app is open still shows as a banner.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export type PushResult = { ok?: true; error?: "denied" | "unsupported" | "failed" };

async function deviceToken(): Promise<string> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: words().t.notificationsPage.title,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

async function register(): Promise<void> {
  const token = await deviceToken();
  const { error } = await supabase.rpc("register_push_token", { p_token: token, p_platform: Platform.OS });
  if (error) throw new Error(error.message);
}

/** Whether this device may show notifications (asked before, and allowed). */
export async function pushAllowed(): Promise<boolean> {
  if (!PUSH_SUPPORTED) return false;
  return (await Notifications.getPermissionsAsync()).status === "granted";
}

/** On the member's tap: asks for permission if needed and registers this device for them. */
export async function enablePush(): Promise<PushResult> {
  if (!PUSH_SUPPORTED) return { error: "unsupported" };
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return { error: "denied" };
  try {
    await register();
    return { ok: true };
  } catch {
    return { error: "failed" };
  }
}

/**
 * Quietly registers this device again for the signed-in member when permission was given before:
 * the token may have changed, or another member signed in on this phone (the token moves to them).
 */
export async function syncPushToken(): Promise<void> {
  if (!(await pushAllowed())) return;
  try {
    await register();
  } catch {
    // Tried again on the next launch.
  }
}

/** Before signing out: this device stops receiving the member's notifications. */
export async function forgetPushToken(): Promise<void> {
  if (!(await pushAllowed())) return;
  try {
    const token = await deviceToken();
    await supabase.from("push_tokens").delete().eq("token", token);
  } catch {
    // Signing out goes on; the next member's sign-in takes the token over anyway.
  }
}

/** The site path a push carries (`data.href`), if any. */
export function pushHref(response: Notifications.NotificationResponse): string | null {
  const href = response.notification.request.content.data?.href;
  return typeof href === "string" ? href : null;
}
