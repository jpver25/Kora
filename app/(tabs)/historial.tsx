import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import { strings } from '@/constants/strings.es';
import { clearHistory, getHistory } from '@/services/history';
import { getFavorites, type FavoriteEntry } from '@/services/favorites';
import type { HistoryEntry, IdentificationMethod } from '@/types/product';
import { colors, radii, spacing, typography } from '@/theme';

type MethodFilter = 'all' | IdentificationMethod;

export default function HistorialScreen() {
  const params = useLocalSearchParams<{ favorites?: string }>();
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState<MethodFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(params.favorites === '1');

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([getHistory(), getFavorites()]).then(([list, favs]) => {
        if (!alive) return;
        setItems(list);
        setFavorites(favs);
        if (params.favorites === '1') setFavoritesOnly(true);
      });
      return () => {
        alive = false;
      };
    }, [params.favorites]),
  );

  const favSet = useMemo(() => new Set(favorites.map((f) => f.barcode)), [favorites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (method !== 'all' && item.method !== method) return false;
      if (favoritesOnly && !favSet.has(item.barcode)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.brand ?? '').toLowerCase().includes(q) ||
        item.barcode.includes(q)
      );
    });
  }, [favSet, favoritesOnly, items, method, query]);

  const onClear = () => {
    Alert.alert(strings.history.clear, strings.history.empty, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.history.clear,
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setItems([]);
        },
      },
    ]);
  };

  const methods: { id: MethodFilter; label: string }[] = [
    { id: 'all', label: strings.history.filterAll },
    { id: 'barcode', label: strings.history.filterBarcode },
    { id: 'visual', label: strings.history.filterVisual },
    { id: 'manual', label: strings.history.filterManual },
  ];

  return (
    <Screen scroll>
      <Text style={styles.brand}>{strings.appName}</Text>
      <Text style={styles.title}>{strings.history.title}</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={strings.history.searchPlaceholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />

      <View style={styles.row}>
        {methods.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setMethod(m.id)}
            style={[styles.chip, method === m.id && styles.chipActive]}>
            <Text style={[styles.chipText, method === m.id && styles.chipTextActive]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => setFavoritesOnly((v) => !v)}
        style={[styles.chip, favoritesOnly && styles.chipActive, { alignSelf: 'flex-start', marginTop: spacing.sm }]}>
        <Text style={[styles.chipText, favoritesOnly && styles.chipTextActive]}>
          {strings.history.favoritesOnly}
        </Text>
      </Pressable>

      {filtered.length === 0 ? (
        <EmptyState title={strings.history.empty} />
      ) : (
        <>
          {filtered.map((item) => (
            <View key={item.id}>
              <ProductCard
                name={item.name}
                brand={item.brand}
                imageUrl={item.imageUrl}
                scoreValue={item.scoreValue}
                scoreBand={item.scoreBand}
                onPress={() => router.push(`/product/${item.barcode}`)}
              />
              <Text style={styles.meta}>
                {strings.history.method}: {item.method}
                {favSet.has(item.barcode) ? ' · ★' : ''}
              </Text>
            </View>
          ))}
          <Button
            label={strings.history.clear}
            variant="ghost"
            onPress={onClear}
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...typography.label, color: colors.secondary },
  title: { ...typography.title, color: colors.primary, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    ...typography.body,
    color: colors.ink,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.ink, fontFamily: typography.bodyStrong.fontFamily },
  chipTextActive: { color: colors.white },
  meta: { ...typography.caption, color: colors.muted, marginTop: -4, marginBottom: spacing.sm },
});
