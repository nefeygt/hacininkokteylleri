import type { User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Tables } from "@shared/supabase/database.types";
import { supabase } from "./supabase";

export type Profile = Pick<Tables<"profiles">, "id" | "username" | "display_name" | "bio" | "avatar_path" | "hidden_at">;
export type Settings = Pick<Tables<"account_settings">, "logs_public_default" | "email_notifications" | "push_notifications">;

/**
 * Who is using the app — the site's accountSession() (src/lib/account.ts):
 * - "signed-out":  no session
 * - "onboarding":  signed in, no profile yet (username + 18+ still owed)
 * - "ok":          a member with a profile
 */
export type SessionState =
  | { state: "loading" }
  | { state: "signed-out" }
  | { state: "onboarding"; user: User }
  | { state: "ok"; user: User; profile: Profile; settings: Settings };

type SessionValue = SessionState & {
  /** Reads the profile and settings again, after a write. */
  reload: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

async function read(user: User | null | undefined): Promise<SessionState> {
  if (!user) return { state: "signed-out" };
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, bio, avatar_path, hidden_at").eq("id", user.id).maybeSingle(),
    supabase.from("account_settings").select("logs_public_default, email_notifications, push_notifications").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!profile) return { state: "onboarding", user };
  return { state: "ok", user, profile, settings: settings ?? { logs_public_default: false, email_notifications: true, push_notifications: true } };
}

/** The session in the device's storage, the profile and the account settings, for every screen. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ state: "loading" });

  const reload = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setSession(await read(data.user));
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Supabase calls this with the stored session first (INITIAL_SESSION). The
    // database reads wait a tick: awaiting the client inside the callback deadlocks it.
    const { data } = supabase.auth.onAuthStateChange((event, auth) => {
      if (event === "TOKEN_REFRESHED") return;
      setTimeout(async () => {
        const next = await read(auth?.user);
        if (!cancelled) setSession(next);
      }, 0);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return <SessionContext.Provider value={{ ...session, reload }}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession outside SessionProvider");
  return value;
}

/** The name a sign-in provider gave us (Google, Apple), for onboarding's suggestions. */
export function nameOf(user: User): string {
  const m = user.user_metadata ?? {};
  const name = m.full_name ?? m.name;
  return typeof name === "string" ? name.trim() : "";
}
