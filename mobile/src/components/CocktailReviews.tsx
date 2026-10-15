import { REVIEW_MAX_LENGTH, formatAverage } from "@shared/community";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import { deleteReview, fetchReviews, formatDay, saveReview, type Review, type Writer } from "@/lib/community";
import type { Cocktail } from "@/lib/content";
import { useSession } from "@/lib/session";
import { alpha, colors, fonts } from "@/lib/theme";
import Avatar from "./Avatar";
import { Message } from "./Form";
import ReportButton from "./ReportButton";
import Stars from "./Stars";
import { Body, Label, Mono } from "./Type";

/**
 * The reviews under a recipe (the site's CocktailReviews). A member writes one
 * review per cocktail; writing again edits it (ADR-012). `onChanged` lets the
 * screen reload the average after the member's own write.
 */
export default function CocktailReviews({ cocktail, onChanged }: { cocktail: Cocktail; onChanged: () => void }) {
  const session = useSession();
  const writer: Writer | null = session.state === "ok" ? { id: session.profile.id, username: session.profile.username } : null;
  const memberId = writer?.id ?? null;
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [own, setOwn] = useState<Review | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await fetchReviews(cocktail.id, memberId);
      setReviews(result.reviews);
      setOwn(result.own);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [cocktail.id, memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const others = (reviews ?? []).filter((r) => r.user_id !== memberId);

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Label style={styles.title}>Değerlendirmeler</Label>
        {cocktail.rating && (
          <View style={styles.average}>
            <Stars value={cocktail.rating.average} size={12} />
            <Mono style={styles.averageText}>
              {formatAverage(cocktail.rating.average)} · {cocktail.rating.count}
            </Mono>
          </View>
        )}
      </View>

      <OwnReview
        cocktail={cocktail}
        writer={writer}
        signedIn={session.state !== "signed-out" && session.state !== "loading"}
        loading={session.state === "loading"}
        own={own}
        onSaved={async () => {
          await load();
          onChanged();
        }}
      />

      {failed ? (
        <Pressable onPress={load} style={styles.gapTop}>
          <Mono style={styles.muted}>Değerlendirmeler yüklenemedi. Tekrar dene</Mono>
        </Pressable>
      ) : reviews === null ? (
        <Mono style={[styles.muted, styles.gapTop]}>Yükleniyor…</Mono>
      ) : others.length === 0 ? (
        <Mono style={[styles.muted, styles.gapTop]}>{own ? "Başka değerlendirme yok." : "Henüz değerlendirme yok. İlk sen yaz."}</Mono>
      ) : (
        <View style={styles.list}>
          {others.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </View>
      )}
    </View>
  );
}

function OwnReview({
  cocktail,
  writer,
  signedIn,
  loading,
  own,
  onSaved,
}: {
  cocktail: Cocktail;
  writer: Writer | null;
  signedIn: boolean;
  loading: boolean;
  own: Review | null;
  onSaved: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setRating(own?.rating ?? 0);
    setBody(own?.body ?? "");
  }, [own]);

  if (loading) return null;

  if (!writer) {
    // Signed out, or signed in without a profile yet: the Hesap tab handles both.
    return (
      <Pressable
        onPress={() => askToSignIn({ pathname: "/cocktail/[slug]", params: { slug: cocktail.slug } })}
        style={styles.prompt}
        accessibilityRole="link"
      >
        <Mono style={styles.promptText}>
          {signedIn ? "Değerlendirme yazmak için önce " : "Değerlendirmek ve favorilere eklemek için "}
          <Mono style={styles.link}>{signedIn ? "profilini tamamla" : "giriş yap"}</Mono>.
        </Mono>
      </Pressable>
    );
  }

  if (own && !editing) {
    return (
      <View style={styles.box}>
        <View style={styles.boxHead}>
          <Label>Senin değerlendirmen</Label>
          <Pressable onPress={() => setEditing(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Düzenle">
            <Mono style={styles.link}>Düzenle</Mono>
          </Pressable>
        </View>
        <Stars value={own.rating} />
        {own.body && <Body style={styles.reviewBody}>{own.body}</Body>}
        {own.hidden_at && (
          <Mono style={styles.hiddenNote}>Bu değerlendirme yöneticiler tarafından gizlendi; yalnızca sen görüyorsun.</Mono>
        )}
      </View>
    );
  }

  async function save() {
    Keyboard.dismiss();
    setError(null);
    if (rating < 0.5) {
      setError("Önce bir puan seç.");
      return;
    }
    setPending(true);
    const result = await saveReview(writer!, cocktail.id, rating, body);
    if (result.error) {
      setPending(false);
      setError(result.error);
      return;
    }
    await onSaved();
    setPending(false);
    setEditing(false);
  }

  async function remove() {
    Keyboard.dismiss();
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    setError(null);
    setPending(true);
    const result = await deleteReview(writer!, cocktail.id);
    if (result.error) {
      setPending(false);
      setError(result.error);
      return;
    }
    await onSaved();
    setPending(false);
    setEditing(false);
  }

  function cancel() {
    setEditing(false);
    setError(null);
    setConfirmingDelete(false);
    setRating(own?.rating ?? 0);
    setBody(own?.body ?? "");
  }

  return (
    <View style={styles.box}>
      {/* The stars get their own row: next to the label they ran out of the box on a phone. */}
      <Label>{own ? "Değerlendirmeni düzenle" : "Değerlendir"}</Label>
      <Stars value={rating} onChange={setRating} />
      <TextInput
        value={body}
        onChangeText={setBody}
        maxLength={REVIEW_MAX_LENGTH}
        multiline
        placeholder="Nasıldı? (isteğe bağlı)"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel="Yorum"
        style={styles.textarea}
      />
      {error && <Message error>{error}</Message>}
      <View style={styles.actions}>
        <Pressable onPress={save} disabled={pending} style={[styles.save, pending && styles.off]} accessibilityRole="button" accessibilityLabel="Kaydet">
          <Mono style={styles.saveText}>{pending ? "Kaydediliyor…" : "Kaydet"}</Mono>
        </Pressable>
        {own && (
          <>
            <Pressable onPress={cancel} disabled={pending} hitSlop={8} accessibilityRole="button" accessibilityLabel="Vazgeç">
              <Mono style={styles.muted}>Vazgeç</Mono>
            </Pressable>
            <Pressable
              onPress={remove}
              disabled={pending}
              hitSlop={8}
              style={styles.delete}
              accessibilityRole="button"
              accessibilityLabel={confirmingDelete ? "Emin misin? Evet, sil" : "Sil"}
            >
              <Mono style={[styles.underline, confirmingDelete ? styles.danger : styles.muted]}>
                {confirmingDelete ? "Emin misin? Evet, sil" : "Sil"}
              </Mono>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const openProfile = () => router.push({ pathname: "/u/[username]", params: { username: review.profiles.username } });

  return (
    <View style={styles.item}>
      <Pressable onPress={openProfile} accessibilityRole="link" accessibilityLabel={review.profiles.display_name}>
        <Avatar path={review.profiles.avatar_path} name={review.profiles.display_name} size={32} />
      </Pressable>
      <View style={styles.itemBody}>
        <View style={styles.itemHead}>
          <Pressable onPress={openProfile} accessibilityRole="link">
            <Body style={styles.name}>{review.profiles.display_name}</Body>
          </Pressable>
          <Stars value={review.rating} size={12} />
          <Mono style={styles.date}>{formatDay(review.updated_at)}</Mono>
        </View>
        {review.body && <Body style={styles.reviewBody}>{review.body}</Body>}
        <View style={styles.report}>
          <ReportButton targetType="review" targetId={review.id} ownerId={review.user_id} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 24, marginTop: 32 },
  head: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  title: { fontSize: 11, letterSpacing: 1.5 },
  average: { flexDirection: "row", alignItems: "center", gap: 8 },
  averageText: { fontSize: 12 },
  gapTop: { marginTop: 16 },
  muted: { fontSize: 12, color: colors.textMuted },
  link: { fontSize: 12, color: colors.crimsonGlow, textDecorationLine: "underline" },
  underline: { textDecorationLine: "underline" },
  danger: { fontSize: 12, color: colors.crimsonGlow },
  prompt: { backgroundColor: alpha(colors.bgElevated, 0.5), borderRadius: 4, paddingHorizontal: 16, paddingVertical: 12 },
  promptText: { fontSize: 12 },
  box: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: alpha(colors.bgElevated, 0.4),
    borderRadius: 4,
    padding: 14,
  },
  boxHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 16 },
  save: { backgroundColor: colors.crimson, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 7 },
  saveText: { fontSize: 12, color: "#fff" },
  delete: { marginLeft: "auto" },
  off: { opacity: 0.5 },
  hiddenNote: { fontSize: 11, color: colors.crimsonGlow },
  list: { marginTop: 20, gap: 20 },
  item: { flexDirection: "row", gap: 12 },
  itemBody: { flex: 1, minWidth: 0 },
  itemHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 4 },
  name: { fontFamily: fonts.sansBold, fontSize: 14 },
  date: { fontSize: 10, color: colors.textMuted },
  reviewBody: { marginTop: 4, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  report: { marginTop: 6 },
});
