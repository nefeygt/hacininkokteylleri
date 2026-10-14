import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import type { Database } from "@shared/supabase/database.types";

// Public settings from mobile/.env (committed, public by design — ADR-008).
// Each variable is read by its literal name so Expo can inline it.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** The website, for links and for revalidating its static pages after a write (ADR-020). */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://hacininkokteylleri.tech";

/**
 * The one client: the publishable key plus the member's session, kept in the
 * device's storage. Row Level Security decides what it may do (ADR-007).
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is in the foreground.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

function publicUrl(bucket: string, path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const key = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${key}`;
}

export const cocktailImageUrl = (path: string | null | undefined) => publicUrl("cocktail-images", path);
export const recipeImageUrl = (path: string | null | undefined) => publicUrl("recipe-images", path);
export const avatarUrl = (path: string | null | undefined) => publicUrl("avatars", path);
