import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import { useSession } from "@/lib/session";
import { isFollowing, setFollow } from "@/lib/social";
import { colors } from "@/lib/theme";
import { Mono } from "./Type";

/**
 * "Takip et" on someone else's profile (the site's FollowButton, ADR-018).
 * Hidden on the member's own profile; a visitor is sent to sign in and comes
 * back to the profile. `onChanged` lets the screen reload the counts.
 */
export default function FollowButton({ profile, onChanged }: { profile: { id: string; username: string }; onChanged: () => void }) {
  const session = useSession();
  const member = session.state === "ok" ? session.profile : null;
  const [following, setFollowing] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!member || member.id === profile.id) return;
    let cancelled = false;
    isFollowing(member.id, profile.id).then((on) => {
      if (!cancelled) setFollowing(on);
    });
    return () => {
      cancelled = true;
    };
  }, [member?.id, profile.id]);

  if (session.state === "loading" || member?.id === profile.id) return null;

  if (!member) {
    return (
      <Pressable
        onPress={() => askToSignIn({ pathname: "/u/[username]", params: { username: profile.username } })}
        style={[styles.button, styles.outline]}
        accessibilityRole="button"
        accessibilityLabel="Takip et"
      >
        <Mono style={styles.outlineText}>Takip et</Mono>
      </Pressable>
    );
  }

  if (following === null) return <ActivityIndicator size="small" color={colors.textMuted} />;

  async function toggle() {
    if (!member || following === null) return;
    setError(null);
    setPending(true);
    const result = await setFollow({ id: member.id, username: member.username }, profile, !following);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setFollowing(!following);
    onChanged();
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={toggle}
        disabled={pending}
        style={[styles.button, following ? styles.outline : styles.solid, pending && styles.off]}
        accessibilityRole="button"
        accessibilityLabel={following ? "Takip ediliyor" : "Takip et"}
        accessibilityState={{ selected: following, busy: pending }}
      >
        <Mono style={following ? styles.outlineText : styles.solidText}>{following ? "Takip ediliyor" : "Takip et"}</Mono>
      </Pressable>
      {error && <Mono style={styles.error}>{error}</Mono>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, alignItems: "flex-start" },
  button: { borderRadius: 4, paddingHorizontal: 16, paddingVertical: 8 },
  solid: { backgroundColor: colors.crimson },
  solidText: { fontSize: 12, color: "#fff" },
  outline: { borderWidth: 1, borderColor: colors.borderLight },
  outlineText: { fontSize: 12, color: colors.textSecondary },
  off: { opacity: 0.6 },
  error: { fontSize: 10, color: colors.crimsonGlow },
});
