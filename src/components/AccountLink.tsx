"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, UserRound } from "lucide-react";
import { ACCOUNTS_OPEN } from "@/lib/account-config";
import { createClient } from "@/lib/supabase/browser";
import { NOTIFICATIONS_SEEN_EVENT } from "./NotificationsSeen";

const NOTIFICATIONS_PATH = "/account/notifications";

/**
 * "Giriş" or "Hesabım" in the navbar, and the notification bell (ADR-030). It reads the session
 * in the browser, so the public pages stay static (ADR-005). Hidden until accounts open (M3).
 * On phones the bar has no room for the bell: the account icon carries the unread dot, and
 * /account leads on to the notifications.
 */
export default function AccountLink({ pathname }: { pathname: string }) {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!ACCOUNTS_OPEN) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  const count = useCallback(async () => {
    if (!userId) {
      setUnread(0);
      return;
    }
    const { count } = await createClient()
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    setUnread(count ?? 0);
  }, [userId]);

  // Again on every page change, and when the notifications page has marked them read.
  useEffect(() => {
    count();
  }, [count, pathname]);
  useEffect(() => {
    const onSeen = () => setUnread(0);
    window.addEventListener(NOTIFICATIONS_SEEN_EVENT, onSeen);
    return () => window.removeEventListener(NOTIFICATIONS_SEEN_EVENT, onSeen);
  }, []);

  if (!ACCOUNTS_OPEN || userId === undefined) return null;

  const signedIn = Boolean(userId);
  const accountActive = pathname === "/account" || pathname === "/login";
  const bellActive = pathname === NOTIFICATIONS_PATH;
  const badge = unread > 9 ? "9+" : String(unread);
  const linkClass = (active: boolean) =>
    `relative flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1.5 sm:px-3 font-mono text-xs tracking-wide transition-colors ${
      active ? "bg-crimson/15 text-crimson-glow" : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
    }`;

  return (
    <>
      {signedIn && (
        <Link
          href={NOTIFICATIONS_PATH}
          aria-label={unread ? `Bildirimler, ${unread} yeni` : "Bildirimler"}
          className={`${linkClass(bellActive)} ml-1 hidden sm:flex`}
        >
          <Bell className="h-3.5 w-3.5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-crimson px-1 text-center text-[9px] leading-4 text-white">
              {badge}
            </span>
          )}
        </Link>
      )}
      <Link
        href={signedIn ? "/account" : "/login"}
        aria-label={signedIn && unread > 0 ? `Hesabım, ${unread} yeni bildirim` : undefined}
        className={`${linkClass(accountActive)} ml-1`}
      >
        <UserRound className="h-3.5 w-3.5" />
        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-crimson-glow sm:hidden" aria-hidden />
        )}
        {/* Icon only on phones, so the bar (with "Görünüm") fits 375 px. */}
        <span className="sr-only sm:not-sr-only">{signedIn ? "Hesabım" : "Giriş"}</span>
      </Link>
    </>
  );
}
