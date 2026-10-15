import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ImagePlus, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, View } from "react-native";
import { BIO_MAX, checkProfile, DISPLAY_NAME_MAX, profileError } from "@shared/profile";
import { signOutOfGoogle } from "@/lib/native-auth";
import { revalidateSite } from "@/lib/revalidate";
import type { Profile, Settings } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors, readable } from "@/lib/theme";
import Avatar from "./Avatar";
import { Button, Field, Message, Notice } from "./Form";
import { Heading, Label, Mono } from "./Type";

const AVATARS_BUCKET = "avatars";
const RECIPE_IMAGES_BUCKET = "recipe-images";
const AVATAR_SIZE = 256;

/** The site's /account: profile, picture, the logs setting, sign out, delete. */
export default function AccountView({
  email,
  profile,
  settings,
  reload,
}: {
  email: string | undefined;
  profile: Profile;
  settings: Settings;
  reload: () => Promise<void>;
}) {
  return (
    <View style={styles.card}>
      <Label style={styles.eyebrow}>Hesap</Label>
      <Heading style={styles.title}>Hesabım</Heading>
      {email && <Mono style={styles.subtitle}>{email} ile giriş yaptın.</Mono>}

      {profile.hidden_at && (
        <View style={styles.section}>
          <Notice>Profilin bir yönetici tarafından gizlendi; şu an yalnızca sen görüyorsun.</Notice>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Label style={styles.sectionTitle}>Profil</Label>
          <Button
            kind="link"
            title="Herkese açık profilin →"
            onPress={() => router.push({ pathname: "/u/[username]", params: { username: profile.username } })}
          />
        </View>
        <AvatarField profile={profile} reload={reload} />
        <ProfileForm profile={profile} reload={reload} />
      </View>

      <View style={[styles.section, styles.ruled]}>
        <View style={styles.sectionHead}>
          <Label style={styles.sectionTitle}>İçki günlüğü</Label>
          <Button kind="link" title="Günlüğüm →" onPress={() => router.push("/logs")} />
        </View>
        <LogsDefaultToggle userId={profile.id} initial={settings.logs_public_default} reload={reload} />
      </View>

      <View style={[styles.section, styles.ruled, styles.row]}>
        <Mono style={styles.muted}>Bu cihazdan çık</Mono>
        <SignOutButton />
      </View>

      <View style={[styles.section, styles.ruled]}>
        <Label style={[styles.sectionTitle, { color: colors.crimsonGlow }]}>Hesabı sil</Label>
        <Mono style={styles.muted}>Hesabın, profilin ve yazdığın her şey kalıcı olarak silinir. Bu geri alınamaz.</Mono>
        <DeleteAccount profile={profile} />
      </View>
    </View>
  );
}

/** Centre square → 256 px WebP → "{user_id}/{base36}.webp"; the old picture is deleted, never overwritten (ADR-006). */
function AvatarField({ profile, reload }: { profile: Profile; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function point(next: string | null) {
    const storage = supabase.storage.from(AVATARS_BUCKET);
    const { error } = await supabase.from("profiles").update({ avatar_path: next }).eq("id", profile.id);
    if (error) {
      // The profile still points at the old picture; drop the unused upload.
      if (next) await storage.remove([next]);
      throw new Error(`Kaydedilemedi: ${error.message}`);
    }
    if (profile.avatar_path && profile.avatar_path !== next) await storage.remove([profile.avatar_path]);
    await reload();
    revalidateSite([`/u/${profile.username}`]);
  }

  async function pick() {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    setBusy(true);
    try {
      const side = Math.min(asset.width, asset.height);
      const image = await ImageManipulator.manipulate(asset.uri)
        .crop({ originX: (asset.width - side) / 2, originY: (asset.height - side) / 2, width: side, height: side })
        .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
        .renderAsync();
      const saved = await image.saveAsync({ format: SaveFormat.WEBP, compress: 0.85 });
      const body = await (await fetch(saved.uri)).arrayBuffer();

      const name = `${profile.id}/${Date.now().toString(36)}.webp`;
      const { error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(name, body, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
      if (error) throw new Error("Yükleme başarısız.");
      await point(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yükleme başarısız.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await point(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaldırılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.avatarRow}>
      <View>
        <Avatar path={profile.avatar_path} name={profile.display_name} size={72} />
        {busy && (
          <View style={styles.avatarBusy}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        )}
      </View>
      <View style={styles.avatarActions}>
        <Button
          kind="secondary"
          title={profile.avatar_path ? "Fotoğrafı değiştir" : "Fotoğraf yükle"}
          icon={<ImagePlus size={14} color={colors.textSecondary} />}
          onPress={pick}
          disabled={busy}
        />
        {profile.avatar_path && (
          <Button kind="link" title="Kaldır" icon={<X size={12} color={colors.textMuted} />} onPress={remove} disabled={busy} />
        )}
        {error && <Message error>{error}</Message>}
      </View>
    </View>
  );
}

function ProfileForm({ profile, reload }: { profile: Profile; reload: () => Promise<void> }) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setError(null);
    setSaved(false);
    const fields = checkProfile({ username, displayName, bio });
    if ("error" in fields) return setError(fields.error);

    setPending(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: fields.username, display_name: fields.displayName, bio: fields.bio })
      .eq("id", profile.id);
    setPending(false);
    if (error) return setError(profileError(error.code, error.message));

    setSaved(true);
    revalidateSite([`/u/${profile.username}`, `/u/${fields.username}`]);
    await reload();
  }

  return (
    <View style={styles.stack}>
      <Field
        label="Kullanıcı adı"
        prefix="@"
        value={username}
        onChangeText={(text) => setUsername(text.toLowerCase())}
        maxLength={20}
        autoCapitalize="none"
        autoCorrect={false}
        hint="3–20 karakter: küçük harf, rakam, alt çizgi."
      />
      <Field label="Görünen ad" value={displayName} onChangeText={setDisplayName} maxLength={DISPLAY_NAME_MAX} />
      <Field
        label="Hakkında"
        value={bio}
        onChangeText={setBio}
        maxLength={BIO_MAX}
        multiline
        style={styles.bio}
        hint={`${bio.length}/${BIO_MAX}`}
      />
      {error && <Message error>{error}</Message>}
      {saved && <Message>Kaydedildi.</Message>}
      <Button title="Kaydet" onPress={save} pending={pending} />
    </View>
  );
}

/** Whether new drink logs start public; private unless the member changes it (ADR-014). */
function LogsDefaultToggle({ userId, initial, reload }: { userId: string; initial: boolean; reload: () => Promise<void> }) {
  const [checked, setChecked] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: boolean) {
    setChecked(next);
    setError(null);
    setPending(true);
    const { error } = await supabase.from("account_settings").update({ logs_public_default: next }).eq("user_id", userId);
    setPending(false);
    if (error) {
      setChecked(!next);
      setError(`Kaydedilemedi: ${error.message}`);
      return;
    }
    // The log form reads the default from the session.
    await reload();
  }

  return (
    <View style={styles.stack}>
      <View style={styles.toggleRow}>
        <Mono style={[styles.muted, styles.toggleText]}>
          Yeni kayıtlarım herkese açık başlasın. Her kaydı ayrıca açıp kapatabilirsin; mevcut kayıtlar değişmez.
        </Mono>
        <Switch
          value={checked}
          onValueChange={change}
          disabled={pending}
          accessibilityLabel="Yeni kayıtlarım herkese açık başlasın"
          trackColor={{ true: colors.crimson, false: colors.borderLight }}
          thumbColor={colors.textPrimary}
        />
      </View>
      {error && <Message error>{error}</Message>}
    </View>
  );
}

function SignOutButton() {
  const [pending, setPending] = useState(false);
  return (
    <Button
      kind="secondary"
      title="Çıkış yap"
      pending={pending}
      onPress={async () => {
        setPending(true);
        await signOutOfGoogle();
        await supabase.auth.signOut();
        // The session provider shows the sign-in screen.
      }}
    />
  );
}

/**
 * Deletes the account and, through the cascades, everything the member wrote
 * (the stores require in-app deletion). Supabase refuses to delete a user who
 * still owns Storage objects, so the member's own files go first (ADR-014).
 */
function DeleteAccount({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setError(null);
    setPending(true);
    const fail = (message: string) => {
      setError(message);
      setPending(false);
    };

    for (const bucket of [AVATARS_BUCKET, RECIPE_IMAGES_BUCKET]) {
      const storage = supabase.storage.from(bucket);
      const { data: files, error: listError } = await storage.list(profile.id, { limit: 1000 });
      if (listError) return fail("Dosyaların okunamadı. Tekrar dene.");
      if (files.length > 0) {
        const { error: removeError } = await storage.remove(files.map((f) => `${profile.id}/${f.name}`));
        if (removeError) return fail("Dosyaların silinemedi. Tekrar dene.");
      }
    }

    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      if (error.message.includes("Admin accounts")) return fail("Yönetici hesapları buradan silinemez.");
      if (error.message.includes("uploaded files")) return fail("Önce yüklediğin dosyalar silinmeli. Tekrar dene.");
      return fail(`Hesap silinemedi: ${error.message}`);
    }

    // The site's pages drop the member within their revalidation window: the
    // token no longer belongs to a user, so /api/revalidate refuses it.
    await signOutOfGoogle();
    await supabase.auth.signOut({ scope: "local" });
  }

  if (!open) return <Button kind="danger" title="Hesabımı silmek istiyorum" onPress={() => setOpen(true)} />;

  return (
    <View style={[styles.stack, styles.danger]}>
      <Field
        label={`Onaylamak için kullanıcı adını yaz: ${profile.username}`}
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error && <Message error>{error}</Message>}
      <View style={styles.row}>
        <Button
          title="Kalıcı olarak sil"
          onPress={remove}
          pending={pending}
          disabled={confirmation.trim().toLowerCase() !== profile.username}
        />
        <Button
          kind="secondary"
          title="Vazgeç"
          disabled={pending}
          onPress={() => {
            setOpen(false);
            setConfirmation("");
            setError(null);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, paddingBottom: 48, ...readable },
  eyebrow: { color: colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 6 },
  title: { fontSize: 26, marginBottom: 4 },
  subtitle: { fontSize: 12, color: colors.textMuted },
  section: { marginTop: 24, gap: 16 },
  ruled: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 24 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { color: colors.textSecondary, letterSpacing: 2 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  muted: { fontSize: 12, lineHeight: 18, color: colors.textMuted },
  stack: { gap: 16 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarBusy: {
    ...StyleSheet.absoluteFill,
    borderRadius: 36,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActions: { flex: 1, alignItems: "flex-start", gap: 4 },
  bio: { minHeight: 80, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleText: { flex: 1 },
  danger: { borderWidth: 1, borderColor: "rgba(139, 26, 26, 0.4)", backgroundColor: "rgba(139, 26, 26, 0.05)", borderRadius: 4, padding: 16 },
});
