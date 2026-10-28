import { PITCH_MAX_LENGTH, STATUS_LABELS, formatFirstDay, formatLastDay, formatPeriod, periodState, type ShowcasePeriod } from "@shared/showcase";
import { router, useFocusEffect } from "expo-router";
import { ArrowBigUp, ChevronDown } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { askToSignIn } from "@/lib/after-sign-in";
import type { Writer } from "@/lib/community";
import type { Showcase, ShowcaseEntry } from "@/lib/content";
import { useFavorites } from "@/lib/favorites";
import { useSession } from "@/lib/session";
import {
  applyToShowcase,
  fetchMyApplication,
  fetchMyVotes,
  setShowcaseVote,
  withdrawShowcaseEntry,
  type Eligible,
  type MyEntry,
} from "@/lib/showcase";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import CocktailCard from "./CocktailCard";
import { Button, Message } from "./Form";
import OptionSheet from "./OptionSheet";
import ReportButton from "./ReportButton";
import { Body, Label, Mono } from "./Type";

const openRecipe = (slug: string) => router.push({ pathname: "/recipes/[slug]", params: { slug } });

/**
 * "Vitrin" on the Akış tab (the site's ShowcaseSection, ADR-019): the open (or
 * next) period, applying and withdrawing, approved entries with upvotes, and the
 * last winner. Hidden until a period exists. `onChanged` reloads the counts.
 */
export default function ShowcaseSection({
  showcase,
  winner,
  onChanged,
}: {
  showcase: Showcase;
  winner: ShowcaseEntry | null;
  onChanged: () => void;
}) {
  const styles = useStyles(makeStyles);
  const { period, entries } = showcase;
  if (!period && !winner) return null;
  const state = period ? periodState(period) : null;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Label style={styles.title}>Vitrin</Label>
        {period && <Mono style={styles.period}>{formatPeriod(period)}</Mono>}
      </View>
      {period && (
        <Mono style={styles.hint}>
          {state === "open"
            ? `Oylama ${formatLastDay(period)} günü sonunda bitiyor · en çok oyu alan tarif ana sayfada`
            : `Başvurular açık · oylama ${formatFirstDay(period)} tarihinde başlıyor`}
        </Mono>
      )}

      {period ? (
        <>
          <ShowcaseApply period={period} onChanged={onChanged} />
          <ShowcaseEntries period={period} entries={entries} onChanged={onChanged} />
        </>
      ) : (
        <Mono style={styles.muted}>Şu an açık bir vitrin dönemi yok.</Mono>
      )}

      {winner && (
        <View style={styles.winner}>
          <Mono style={styles.winnerText}>Son kazanan: </Mono>
          <Pressable onPress={() => openRecipe(winner.recipe.slug)} accessibilityRole="link" hitSlop={6}>
            <Mono style={[styles.winnerText, styles.winnerName]}>{winner.recipe.name}</Mono>
          </Pressable>
          <Mono style={styles.winnerText}>
            {winner.recipe.author ? ` · @${winner.recipe.author.username}` : ""} · {winner.voteCount} oy
          </Mono>
        </View>
      )}
    </View>
  );
}

/** "Vitrine başvur" (the site's ShowcaseApply): one application per member per period, with a photo recipe and a pitch. */
function ShowcaseApply({ period, onChanged }: { period: ShowcasePeriod; onChanged: () => void }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const session = useSession();
  const writer: Writer | null = session.state === "ok" ? { id: session.profile.id, username: session.profile.username } : null;
  const memberId = writer?.id ?? null;
  const [mine, setMine] = useState<MyEntry | null | undefined>(undefined);
  const [eligible, setEligible] = useState<Eligible[]>([]);
  const [open, setOpen] = useState(false);
  const [cocktailId, setCocktailId] = useState("");
  const [picking, setPicking] = useState(false);
  const [pitch, setPitch] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!memberId) {
      setMine(undefined);
      return;
    }
    try {
      const result = await fetchMyApplication(period.id, memberId);
      setMine(result.mine);
      setEligible(result.eligible);
      setCocktailId((current) => (result.eligible.some((r) => r.id === current) ? current : (result.eligible[0]?.id ?? "")));
    } catch {
      setMine(null);
    }
  }, [memberId, period.id]);

  // Again whenever the tab comes back: a recipe may have been published meanwhile.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (session.state === "loading") return null;

  if (session.state === "signed-out") {
    return (
      <View style={styles.block}>
        <Button kind="secondary" title="Başvurmak için giriş yap" onPress={() => askToSignIn("/feed")} />
      </View>
    );
  }
  if (session.state === "onboarding" || !writer || mine === undefined) return null;

  async function submit() {
    if (!writer) return;
    setError(null);
    setPending(true);
    const result = await applyToShowcase(writer, period.id, cocktailId, pitch);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setPitch("");
    await load();
  }

  async function withdraw() {
    if (!writer || !mine) return;
    setError(null);
    setPending(true);
    const result = await withdrawShowcaseEntry(writer, mine.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setConfirming(false);
    await load();
    onChanged();
  }

  if (mine) {
    const badge = mine.status === "approved" ? styles.approved : mine.status === "rejected" ? styles.rejected : styles.pending;
    const badgeText = mine.status === "approved" ? styles.approvedText : mine.status === "rejected" ? styles.rejectedText : styles.pendingText;
    return (
      <View style={[styles.block, styles.box]}>
        <View style={styles.mineHead}>
          <Label style={styles.mineLabel}>Başvurun</Label>
          <View style={[styles.badge, badge]}>
            <Mono style={[styles.badgeText, badgeText]}>{STATUS_LABELS[mine.status]}</Mono>
          </View>
          {mine.cocktails && (
            <Pressable onPress={() => openRecipe(mine.cocktails!.slug)} accessibilityRole="link" hitSlop={6}>
              <Mono style={styles.mineRecipe}>{mine.cocktails.name}</Mono>
            </Pressable>
          )}
        </View>
        <Body style={styles.pitch}>“{mine.pitch}”</Body>
        {error && <Message error>{error}</Message>}
        <View style={styles.row}>
          {confirming ? (
            <>
              <Mono style={styles.small}>Başvuru ve aldığı oylar silinecek.</Mono>
              <Pressable onPress={withdraw} disabled={pending} hitSlop={6} accessibilityRole="button" accessibilityLabel="Evet, geri çek">
                <Mono style={[styles.small, styles.danger]}>{pending ? "Siliniyor…" : "Evet, geri çek"}</Mono>
              </Pressable>
              <Pressable onPress={() => setConfirming(false)} disabled={pending} hitSlop={6} accessibilityRole="button" accessibilityLabel="Vazgeç">
                <Mono style={styles.small}>Vazgeç</Mono>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setConfirming(true)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Başvuruyu geri çek">
              <Mono style={styles.small}>Başvuruyu geri çek</Mono>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  if (!open) {
    return (
      <View style={styles.block}>
        <Button title="Vitrine başvur" onPress={() => setOpen(true)} />
      </View>
    );
  }

  const chosen = eligible.find((r) => r.id === cocktailId);
  return (
    <View style={[styles.block, styles.box]}>
      {eligible.length === 0 ? (
        <View style={styles.gap}>
          <Mono style={styles.muted}>Başvurmak için yayında ve fotoğraflı bir tarifin olmalı.</Mono>
          <Pressable onPress={() => router.push("/my-recipes")} accessibilityRole="link" hitSlop={6}>
            <Mono style={styles.link}>Tariflerine git</Mono>
          </Pressable>
        </View>
      ) : (
        <View style={styles.gap}>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Tarif</Label>
            <Pressable
              onPress={() => setPicking(true)}
              style={styles.select}
              accessibilityRole="button"
              accessibilityLabel={`Tarif: ${chosen?.name ?? "seç"}`}
            >
              <Body style={styles.selectText} numberOfLines={1}>
                {chosen?.name ?? "Tarif seç"}
              </Body>
              <ChevronDown size={16} color={theme.colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.field}>
            <Label style={styles.fieldLabel}>Neden vitrinde olmalı?</Label>
            <TextInput
              value={pitch}
              onChangeText={setPitch}
              maxLength={PITCH_MAX_LENGTH}
              multiline
              placeholder="Tarifini birkaç cümleyle tanıt."
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Neden vitrinde olmalı?"
              style={styles.input}
            />
            <Mono style={styles.counter}>
              {pitch.length}/{PITCH_MAX_LENGTH}
            </Mono>
          </View>
          <Mono style={styles.note}>Her dönem bir başvuru. Bir yönetici onayladıktan sonra başvurun herkese görünür ve oylanır.</Mono>
        </View>
      )}
      {error && <Message error>{error}</Message>}
      <View style={styles.row}>
        {eligible.length > 0 && (
          <Button title={pending ? "Gönderiliyor…" : "Başvur"} onPress={submit} pending={pending} disabled={!pitch.trim() || !cocktailId} />
        )}
        <Button kind="link" title="Vazgeç" onPress={() => setOpen(false)} disabled={pending} />
      </View>
      <OptionSheet
        title="Tarif"
        options={eligible.map((r) => ({ value: r.id, label: r.name }))}
        current={picking ? cocktailId : null}
        onPick={(value) => {
          setCocktailId(value);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </View>
  );
}

/** The approved entries with their upvotes (the site's ShowcaseEntries); the member's own votes are private. */
function ShowcaseEntries({ period, entries, onChanged }: { period: ShowcasePeriod; entries: ShowcaseEntry[]; onChanged: () => void }) {
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const session = useSession();
  const { favorites } = useFavorites();
  const writer: Writer | null = session.state === "ok" ? { id: session.profile.id, username: session.profile.username } : null;
  const memberId = writer?.id ?? null;
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<Map<string, number>>(() => new Map(entries.map((e) => [e.id, e.voteCount])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = periodState(period) === "open";

  // A reload brings new totals.
  useEffect(() => {
    setCounts(new Map(entries.map((e) => [e.id, e.voteCount])));
  }, [entries]);

  useEffect(() => {
    if (!memberId) {
      setVoted(new Set());
      return;
    }
    let cancelled = false;
    fetchMyVotes(memberId, entries.map((e) => e.id)).then((ids) => {
      if (!cancelled) setVoted(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId, entries]);

  async function toggle(entryId: string) {
    if (!writer) return;
    const on = !voted.has(entryId);
    setError(null);
    // Optimistic; put back if the database refuses.
    const apply = (vote: boolean) => {
      setVoted((prev) => {
        const next = new Set(prev);
        if (vote) next.add(entryId);
        else next.delete(entryId);
        return next;
      });
      setCounts((prev) => new Map(prev).set(entryId, Math.max(0, (prev.get(entryId) ?? 0) + (vote ? 1 : -1))));
    };
    apply(on);
    setBusy(entryId);
    const result = await setShowcaseVote(writer, entryId, on);
    setBusy(null);
    if (result.error) {
      apply(!on);
      setError(result.error);
      return;
    }
    onChanged();
  }

  if (entries.length === 0) return <Mono style={styles.muted}>Henüz onaylanmış başvuru yok.</Mono>;

  return (
    <View style={styles.entries}>
      {error && <Message error>{error}</Message>}
      {entries.map((entry) => {
        const count = counts.get(entry.id) ?? 0;
        const mine = voted.has(entry.id);
        return (
          <View key={entry.id}>
            <CocktailCard cocktail={entry.recipe} favorite={favorites.has(entry.recipe.id)} onPress={() => openRecipe(entry.recipe.slug)} />
            <View style={styles.entryFoot}>
              <Body style={styles.pitch}>“{entry.pitch}”</Body>
              <View style={styles.row}>
                {open && session.state !== "onboarding" && session.state !== "loading" ? (
                  <Pressable
                    onPress={() => (writer ? toggle(entry.id) : askToSignIn("/feed"))}
                    disabled={busy !== null}
                    style={[styles.vote, mine ? styles.voteOn : styles.voteOff, busy === entry.id && styles.off]}
                    accessibilityRole="button"
                    accessibilityLabel={mine ? `Oyunu geri al, ${count} oy` : `Oy ver, ${count} oy`}
                    accessibilityState={{ selected: mine, busy: busy === entry.id }}
                  >
                    <ArrowBigUp size={16} color={mine ? "#fff" : theme.colors.textSecondary} fill={mine ? "#fff" : "transparent"} />
                    <Mono style={[styles.voteText, mine && styles.voteTextOn]}>{count}</Mono>
                  </Pressable>
                ) : (
                  <View style={styles.voteStatic}>
                    <ArrowBigUp size={16} color={theme.colors.textMuted} />
                    <Mono style={styles.small}>{count} oy</Mono>
                  </View>
                )}
                <View style={styles.push} />
                {entry.recipe.author && <ReportButton targetType="showcase_entry" targetId={entry.id} ownerId={entry.recipe.author.id} />}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  section: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: alpha(t.colors.crimson, 0.3),
    backgroundColor: alpha(t.colors.crimson, 0.03),
    borderRadius: 2,
    padding: 16,
  },
  head: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 12, rowGap: 4 },
  title: { fontSize: 11, letterSpacing: 1.5, color: t.colors.crimsonGlow },
  period: { fontSize: 11, color: t.colors.textSecondary },
  hint: { marginTop: 4, fontSize: 10, lineHeight: 15, color: alpha(t.colors.textMuted, 0.8) },
  block: { marginTop: 16, alignItems: "flex-start" },
  box: {
    alignItems: "stretch",
    gap: 10,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: alpha(t.colors.bgCard, 0.6),
    borderRadius: 4,
    padding: 14,
  },
  gap: { gap: 12 },
  muted: { marginTop: 12, fontSize: 12, lineHeight: 18, color: t.colors.textMuted },
  link: { fontSize: 12, color: t.colors.textSecondary, textDecorationLine: "underline" },
  small: { fontSize: 11, color: t.colors.textMuted },
  danger: { color: t.colors.crimsonGlow },
  row: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  push: { flex: 1 },
  off: { opacity: 0.6 },
  mineHead: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 },
  mineLabel: { fontSize: 11, letterSpacing: 1.5 },
  mineRecipe: { fontSize: 11, color: t.colors.textSecondary },
  badge: { borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 11 },
  approved: { backgroundColor: alpha(t.colors.veganBg, 0.4) },
  approvedText: { color: t.colors.vegan },
  rejected: { backgroundColor: alpha(t.colors.crimson, 0.15) },
  rejectedText: { color: t.colors.crimsonGlow },
  pending: { backgroundColor: t.colors.bgElevated },
  pendingText: { color: t.colors.textSecondary },
  pitch: { fontSize: 14, lineHeight: 20, color: t.colors.textSecondary },
  field: { gap: 6 },
  fieldLabel: { color: t.colors.textSecondary, fontSize: 11, letterSpacing: 1.5 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectText: { flex: 1, fontSize: 14, color: t.colors.textPrimary },
  input: {
    minHeight: 84,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: t.colors.textPrimary,
    fontFamily: t.fonts.sans,
    fontSize: 14,
    textAlignVertical: "top",
  },
  counter: { alignSelf: "flex-end", fontSize: 10, color: t.colors.textMuted },
  note: { fontSize: 10, lineHeight: 15, color: t.colors.textMuted },
  entries: { marginTop: 20, gap: 16 },
  entryFoot: {
    gap: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: t.colors.border,
    backgroundColor: alpha(t.colors.bgCard, 0.6),
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  vote: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6 },
  voteOn: { backgroundColor: t.colors.crimson },
  voteOff: { borderWidth: 1, borderColor: t.colors.border },
  voteText: { fontSize: 12, color: t.colors.textSecondary },
  voteTextOn: { color: "#fff" },
  voteStatic: { flexDirection: "row", alignItems: "center", gap: 6 },
  winner: { marginTop: 20, flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
  winnerText: { fontSize: 11, color: t.colors.textMuted },
  winnerName: { color: t.colors.textSecondary },
});
