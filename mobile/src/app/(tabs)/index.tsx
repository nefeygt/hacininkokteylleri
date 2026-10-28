import {
  ALL,
  baseChoices,
  flavorChoices,
  NO_FILTERS,
  filterCocktails,
  hasActiveFilters,
  ingredientFilters,
  sortCocktails,
  type ArchiveSort,
  type ArchiveFilters,
} from "@shared/archive-filter";
import { cocktailOfTheDay } from "@shared/collections";
import { todayInTurkey } from "@shared/drink-log";
import { router } from "expo-router";
import { Heart, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import CocktailCard from "@/components/CocktailCard";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { useArchive } from "@/lib/archive";
import { useFavorites } from "@/lib/favorites";
import { useSession } from "@/lib/session";
import { alpha, type Theme } from "@/lib/theme";
import { useStyles, useTheme } from "@/lib/theme-context";
import { useLocale } from "@/lib/i18n";
import { format } from "@shared/i18n/format";

/** The archive: Hacı's recipes with the site's search and filters (/cocktails). */
export default function ArchiveScreen() {
  const { t, a } = useLocale();
  const styles = useStyles(makeStyles);
  const theme = useTheme();
  const { archive, error, refreshing, refresh } = useArchive();
  const [filters, setFilters] = useState<ArchiveFilters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const isMember = useSession().state === "ok";
  const { favorites, reload: reloadFavorites } = useFavorites();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sort, setSort] = useState<ArchiveSort>("default");

  const cocktails = archive?.cocktails ?? [];
  // "Favorilerim" reads the live set, so un-hearting a recipe drops it from the list.
  const applied = useMemo(
    () => ({ ...filters, onlyFavorites: isMember && onlyFavorites ? favorites : null }),
    [filters, isMember, onlyFavorites, favorites]
  );
  const filtered = useMemo(() => sortCocktails(filterCocktails(cocktails, applied), sort), [cocktails, applied, sort]);
  // "Günün kokteyli": one house recipe a day (Turkey's calendar, like the site), shown while nothing is searched or filtered.
  const pick = useMemo(() => cocktailOfTheDay(cocktails, todayInTurkey()), [cocktails]);
  const baseAlcohols = useMemo(() => baseChoices(cocktails), [cocktails]);
  const flavors = useMemo(() => flavorChoices(cocktails), [cocktails]);
  const active = hasActiveFilters(applied);
  const set = (patch: Partial<ArchiveFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const clearFilters = () => {
    setFilters(NO_FILTERS);
    setOnlyFavorites(false);
  };
  const refreshAll = async () => {
    await Promise.all([refresh(), reloadFavorites()]);
  };

  if (!archive) {
    return (
      <View style={styles.center}>
        {error ? (
          <>
            <Body style={styles.muted}>{a.archive.loadFailed}</Body>
            <Pressable onPress={refresh} style={styles.retry}>
              <Mono style={styles.link}>{t.status.retry}</Mono>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={theme.colors.crimsonGlow} />
        )}
      </View>
    );
  }

  const header = (
    <View>
      <View style={styles.titleBlock}>
        <Label style={styles.eyebrow}>{t.cocktails.eyebrow}</Label>
        <Heading style={styles.title}>{t.cocktails.title}</Heading>
        <Mono style={styles.count}>
          {t.cocktails.approvedPrefix}<Mono style={styles.countNumber}>{cocktails.length}</Mono>{t.cocktails.approvedSuffix}
        </Mono>
        <Pressable onPress={() => router.push("/what-can-i-make")} hitSlop={6} accessibilityRole="link" style={styles.makeLink}>
          <Mono style={styles.link}>{t.cocktails.whatCanIMake}</Mono>
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            value={filters.search}
            onChangeText={(search) => set({ search })}
            placeholder={a.archive.searchPlaceholder}
            numberOfLines={1}
            placeholderTextColor={theme.colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {filters.search ? (
            <Pressable onPress={() => set({ search: "" })} hitSlop={10} accessibilityLabel={t.cocktails.clearSearch}>
              <X size={14} color={theme.colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, showFilters && styles.filterButtonOn]}
          accessibilityRole="button"
          accessibilityState={{ expanded: showFilters }}
        >
          <SlidersHorizontal size={14} color={showFilters ? theme.colors.crimsonGlow : theme.colors.textSecondary} />
          <Mono style={[styles.filterButtonText, showFilters && { color: theme.colors.crimsonGlow }]}>{t.cocktails.filters}</Mono>
        </Pressable>
      </View>

      {showFilters && (
        <View style={styles.filters}>
          <FilterRow label={t.cocktails.sortLabel}>
            {(["default", "rating", "name"] as const).map((choice) => (
              <Chip
                key={choice}
                label={{ default: t.archive.sortDefault, rating: t.archive.sortRating, name: t.archive.sortName }[choice]}
                active={sort === choice}
                onPress={() => setSort(choice)}
              />
            ))}
          </FilterRow>
          <FilterRow label={t.cocktails.rowBase}>
            {baseAlcohols.map((b) => (
              <Chip key={b} label={b === ALL ? t.archive.all : b} active={filters.base === b} onPress={() => set({ base: b })} />
            ))}
          </FilterRow>
          <FilterRow label={t.cocktails.rowFlavor}>
            {flavors.map((f) => (
              <Chip key={f} label={f === ALL ? t.archive.all : f} active={filters.flavor === f} onPress={() => set({ flavor: f })} />
            ))}
          </FilterRow>
          <FilterRow label={t.cocktails.rowIngredient}>
            {ingredientFilters(t).map((ing) => {
              const on = filters.ingredients.includes(ing);
              return (
                <Chip
                  key={ing}
                  label={ing}
                  active={on}
                  onPress={() =>
                    set({ ingredients: on ? filters.ingredients.filter((i) => i !== ing) : [...filters.ingredients, ing] })
                  }
                />
              );
            })}
          </FilterRow>
          {isMember && (
            <FilterRow label={t.cocktails.rowList}>
              <Pressable
                onPress={() => setOnlyFavorites(!onlyFavorites)}
                style={[styles.chip, styles.favoriteChip, onlyFavorites && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: onlyFavorites }}
              >
                <Heart
                  size={12}
                  color={onlyFavorites ? theme.colors.crimsonGlow : theme.colors.textMuted}
                  fill={onlyFavorites ? theme.colors.crimsonGlow : "transparent"}
                />
                <Mono style={[styles.chipText, onlyFavorites && styles.chipTextOn]}>{format(t.cocktails.myFavorites, { n: favorites.size })}</Mono>
              </Pressable>
            </FilterRow>
          )}
          {active && (
            <Pressable onPress={clearFilters}>
              <Label style={styles.clear}>{t.cocktails.clearFiltersUpper}</Label>
            </Pressable>
          )}
        </View>
      )}

      {pick && !active && !filters.search.trim() && (
        <View style={styles.dayBlock}>
          <Label style={styles.dayLabel}>{t.home.dayLabel}</Label>
          <CocktailCard
            cocktail={pick}
            favorite={favorites.has(pick.id)}
            onPress={() => router.push({ pathname: "/cocktail/[slug]", params: { slug: pick.slug } })}
          />
        </View>
      )}

      <Label style={styles.results}>
        {format(t.cocktails.results, { n: filtered.length })}{active ? t.cocktails.filteredSuffix : ""}
      </Label>
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <CocktailCard
          cocktail={item}
          favorite={favorites.has(item.id)}
          onPress={() => router.push({ pathname: "/cocktail/[slug]", params: { slug: item.slug } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Body style={styles.muted}>{t.cocktails.noResults}</Body>
          <Pressable onPress={clearFilters}>
            <Mono style={styles.link}>{t.cocktails.clearFilters}</Mono>
          </Pressable>
        </View>
      }
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={theme.colors.crimsonGlow} />}
    />
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.filterRow}>
      <Label style={styles.filterLabel}>{label}</Label>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Mono style={[styles.chipText, active && styles.chipTextOn]}>{label}</Mono>
    </Pressable>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: t.colors.bgPrimary },
  list: { padding: 16, paddingBottom: 32 },
  gap: { height: 16 },
  titleBlock: { marginTop: 8, marginBottom: 24 },
  eyebrow: { color: t.colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 6 },
  title: { fontSize: 28 },
  count: { marginTop: 6, color: t.colors.textMuted },
  countNumber: { fontFamily: t.fonts.mono, color: t.colors.textSecondary },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontFamily: t.fonts.mono, fontSize: 13, color: t.colors.textPrimary },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  filterButtonOn: { borderColor: alpha(t.colors.crimson, 0.3), backgroundColor: alpha(t.colors.crimson, 0.1) },
  filterButtonText: { fontSize: 12 },
  filters: {
    gap: 18,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: alpha(t.colors.bgCard, 0.5),
    borderRadius: 4,
  },
  filterRow: { gap: 8 },
  filterLabel: { letterSpacing: 1.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: t.colors.bgElevated, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 6 },
  favoriteChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { backgroundColor: alpha(t.colors.crimson, 0.2) },
  chipText: { fontSize: 11, color: t.colors.textMuted },
  chipTextOn: { color: t.colors.crimsonGlow },
  clear: { textDecorationLine: "underline", letterSpacing: 1 },
  makeLink: { marginTop: 8, alignSelf: "flex-start" },
  dayBlock: { marginBottom: 20, gap: 8 },
  dayLabel: { fontSize: 10, letterSpacing: 2.5, color: t.colors.crimsonGlow },
  results: { marginBottom: 16, letterSpacing: 2 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  muted: { color: t.colors.textSecondary },
  retry: { padding: 8 },
  link: { color: t.colors.crimsonGlow, textDecorationLine: "underline" },
});
