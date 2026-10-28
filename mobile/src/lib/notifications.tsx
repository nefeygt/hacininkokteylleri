// Notifications (ADR-030) for the app: the site's /account/notifications and its
// navbar counter. The database writes every row (triggers); the app reads the
// member's own rows, marks them read and counts the unread ones (RLS: own rows only).

import { router, type Href } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import { NOTIFICATION_COLUMNS, NOTIFICATIONS_SHOWN, type NotificationRow } from "@shared/notifications";
import { PUSH_SUPPORTED, pushHref, syncPushToken } from "./push";
import { useSession } from "./session";
import { supabase } from "./supabase";

/** The latest notifications, newest first. */
export async function fetchNotifications(memberId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", memberId)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_SHOWN);
  if (error) throw new Error(error.message);
  return data as unknown as NotificationRow[];
}

/** Opening the list marks everything read, as on the site. */
export async function markAllRead(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", memberId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
}

async function countUnread(memberId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", memberId)
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * The app screen for a link `describeNotification` gives (a site path). Push
 * notifications (ADR-033) carry the same paths, so a tap opens the same screen.
 */
export function appRoute(href: string): Href {
  const path = href.split(/[?#]/)[0].replace(/\/+$/, "");
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  const [first, second, third] = parts;
  if (first === "u" && second) return { pathname: "/u/[username]", params: { username: second } };
  if (first === "logs" && second) return { pathname: "/log/[id]", params: { id: second } };
  if (first === "recipes" && second) return { pathname: "/recipes/[slug]", params: { slug: second } };
  if (first === "cocktails" && second) return { pathname: "/cocktail/[slug]", params: { slug: second } };
  if (first === "feed") return "/feed";
  if (first === "account" && second === "logs") return third ? { pathname: "/logs/[id]", params: { id: third } } : "/logs";
  if (first === "account" && second === "recipes") {
    return third ? { pathname: "/my-recipes/[id]", params: { id: third } } : "/my-recipes";
  }
  if (first === "account" && second === "notifications") return "/notifications";
  return "/account";
}

/** Opens a notification's link; a tab is switched to, never pushed (a pushed tab path opens a second tab navigator). */
export function openNotificationLink(href: string) {
  const route = appRoute(href);
  if (route === "/feed" || route === "/account") router.navigate(route);
  else router.push(route);
}

type NotificationsValue = {
  /** Unread notifications of the signed-in member (0 when signed out). */
  unread: number;
  /** Reads the count again (on focus, after the list marked everything read). */
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

/** The unread count for the Hesap tab's badge: read on sign-in, on coming back to the app and on demand. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const memberId = session.state === "ok" ? session.profile.id : null;
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!memberId) {
      setUnread(0);
      return;
    }
    try {
      setUnread(await countUnread(memberId));
    } catch {
      // A failed count keeps the last one; the next focus tries again.
    }
  }, [memberId]);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    // A push arriving while the app is open is a new unread notification.
    const received = PUSH_SUPPORTED ? Notifications.addNotificationReceivedListener(() => void refresh()) : null;
    return () => {
      subscription.remove();
      received?.remove();
    };
  }, [refresh]);

  // A member who allowed push before gets this device registered again (new token, another member).
  useEffect(() => {
    if (memberId) syncPushToken();
  }, [memberId]);

  return <NotificationsContext.Provider value={{ unread, refresh }}>{children}</NotificationsContext.Provider>;
}

/**
 * Opens the screen of a tapped push — also the one that launched the app. Called from the tab layout,
 * so the router is ready.
 */
export function usePushResponses() {
  useEffect(() => {
    if (!PUSH_SUPPORTED) return;
    let handled: string | null = null;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const id = response.notification.request.identifier;
      const href = pushHref(response);
      if (!href || handled === id) return;
      handled = id;
      openNotificationLink(href);
    };
    Notifications.getLastNotificationResponseAsync().then(open);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);
}

export function useNotifications(): NotificationsValue {
  const value = useContext(NotificationsContext);
  if (!value) throw new Error("useNotifications outside NotificationsProvider");
  return value;
}
