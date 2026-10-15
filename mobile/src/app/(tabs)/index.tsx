import {
  BASE_ALCOHOLS,
  FLAVORS,
  INGREDIENT_FILTERS,
  NO_FILTERS,
  filterCocktails,
  hasActiveFilters,
  type ArchiveFilters,
} from "@shared/archive-filter";
import { router } from "expo-router";
import { Heart, Search, SlidersHorizontal, X } from "lucide-react-native";
import { useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from "react-native";
import CocktailCard from "@/components/CocktailCard";
import { Body, Heading, Label, Mono } from "@/components/Type";
import { useArchive } from "@/lib/archive";
import { useFavorites } from "@/lib/favorites";
import { useSession } from "@/lib/session";
import { alpha, colors, fonts } from "@/lib/theme";

/** The archive: Hacı's recipes with the site's search and filters (/cocktails). */
export default function ArchiveScreen() {
  const { archive, error, refreshing, refresh } = useArchive();
  const [filters, setFilters] = useState<ArchiveFilters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const isMember = useSession().state === "ok";
  const { favorites, reload: reloadFavorites } = useFavorites();
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const cocktails = archive?.cocktails ?? [];
  // "Favorilerim" reads the live set, so un-hearting a recipe drops it from the list.
  const applied = useMemo(
    () => ({ ...filters, onlyFavorites: isMember && onlyFavorites ? favorites : null }),
    [filters, isMember, onlyFavorites, favorites]
  );
  const filtered = useMemo(() => filterCocktails(cocktails, applied), [cocktails, applied]);
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
            <Body style={styles.muted}>Kokteyller yüklenemedi.</Body>
            <Pressable onPress={refresh} style={styles.retry}>
              <Mono style={styles.link}>Tekrar dene</Mono>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={colors.crimsonGlow} />
        )}
      </View>
    );
  }

  const header = (
    <View>
      <View style={styles.titleBlock}>
        <Label style={styles.eyebrow}>Arşiv</Label>
        <Heading style={styles.title}>Kokteyller</Heading>
        <Mono style={styles.count}>
          Hacı onaylı <Mono style={styles.countNumber}>{cocktails.length}</Mono> reçete.
        </Mono>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            value={filters.search}
            onChangeText={(search) => set({ search })}
            placeholder="Kokteyl, malzeme veya etiket ara..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {filters.search ? (
            <Pressable onPress={() => set({ search: "" })} hitSlop={10} accessibilityLabel="Aramayı temizle">
              <X size={14} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={[styles.filterButton, showFilters && styles.filterButtonOn]}
          accessibilityRole="button"
          accessibilityState={{ expanded: showFilters }}
        >
          <SlidersHorizontal size={14} color={showFilters ? colors.crimsonGlow : colors.textSecondary} />
          <Mono style={[styles.filterButtonText, showFilters && { color: colors.crimsonGlow }]}>Filtrele</Mono>
        </Pressable>
      </View>

      {showFilters && (
        <View style={styles.filters}>
          <FilterRow label="Baz Alkol">
            {BASE_ALCOHOLS.map((b) => (
              <Chip key={b} label={b} active={filters.base === b} onPress={() => set({ base: b })} />
            ))}
          </FilterRow>
          <FilterRow label="Baskın Tat">
            {FLAVORS.map((f) => (
              <Chip key={f} label={f} active={filters.flavor === f} onPress={() => set({ flavor: f })} />
            ))}
          </FilterRow>
          <FilterRow label="Malzeme">
            {INGREDIENT_FILTERS.map((ing) => {
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
            <FilterRow label="Listem">
              <Pressable
                onPress={() => setOnlyFavorites(!onlyFavorites)}
                style={[styles.chip, styles.favoriteChip, onlyFavorites && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: onlyFavorites }}
              >
                <Heart
                  size={12}
                  color={onlyFavorites ? colors.crimsonGlow : colors.textMuted}
                  fill={onlyFavorites ? colors.crimsonGlow : "transparent"}
                />
                <Mono style={[styles.chipText, onlyFavorites && styles.chipTextOn]}>Favorilerim ({favorites.size})</Mono>
              </Pressable>
            </FilterRow>
          )}
          {active && (
            <Pressable onPress={clearFilters}>
              <Label style={styles.clear}>Filtreleri Temizle</Label>
            </Pressable>
          )}
        </View>
      )}

      <Label style={styles.results}>
        {filtered.length} sonuç{active ? " (filtrelenmiş)" : ""}
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
          <Body style={styles.muted}>Sonuç bulunamadı.</Body>
          <Pressable onPress={clearFilters}>
            <Mono style={styles.link}>Filtreleri temizle</Mono>
          </Pressable>
        </View>
      }
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor={colors.crimsonGlow} />}
    />
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.filterRow}>
      <Label style={styles.filterLabel}>{label}</Label>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.bgPrimary },
  list: { padding: 16, paddingBottom: 32 },
  gap: { height: 16 },
  titleBlock: { marginTop: 8, marginBottom: 24 },
  eyebrow: { color: colors.crimsonGlow, letterSpacing: 2.5, marginBottom: 6 },
  title: { fontSize: 28 },
  count: { marginTop: 6, color: colors.textMuted },
  countNumber: { fontFamily: fonts.mono, color: colors.textSecondary },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  filterButtonOn: { borderColor: alpha(colors.crimson, 0.3), backgroundColor: alpha(colors.crimson, 0.1) },
  filterButtonText: { fontSize: 12 },
  filters: {
    gap: 18,
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: alpha(colors.bgCard, 0.5),
    borderRadius: 4,
  },
  filterRow: { gap: 8 },
  filterLabel: { letterSpacing: 1.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: colors.bgElevated, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 6 },
  favoriteChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipOn: { backgroundColor: alpha(colors.crimson, 0.2) },
  chipText: { fontSize: 11, color: colors.textMuted },
  chipTextOn: { color: colors.crimsonGlow },
  clear: { textDecorationLine: "underline", letterSpacing: 1 },
  results: { marginBottom: 16, letterSpacing: 2 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  muted: { color: colors.textSecondary },
  retry: { padding: 8 },
  link: { color: colors.crimsonGlow, textDecorationLine: "underline" },
});
