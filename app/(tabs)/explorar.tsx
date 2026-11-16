import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ProductCard } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { strings } from '@/constants/strings.es';
import {
  EXPLORE_CATEGORIES,
  fetchCategoryRanking,
  type ExploreCategory,
} from '@/services/catalogSearch';
import type { Product } from '@/types/product';
import { colors, radii, spacing, typography } from '@/theme';

export default function ExplorarScreen() {
  const [active, setActive] = useState<ExploreCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState<Product[]>([]);
  const requestIdRef = useRef(0);

  const openCategory = async (cat: ExploreCategory) => {
    const requestId = ++requestIdRef.current;
    setActive(cat);
    setLoading(true);
    setRanking([]);
    try {
      const list = await fetchCategoryRanking(cat);
      if (requestId !== requestIdRef.current) return;
      setRanking(list);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setRanking([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text style={styles.brand}>{strings.appName}</Text>
      <Text style={styles.title}>{strings.explore.title}</Text>
      <Text style={styles.sub}>{strings.explore.subtitle}</Text>

      <Pressable style={styles.searchBanner} onPress={() => router.push('/buscar')}>
        <Text style={styles.searchBannerText}>{strings.home.search}</Text>
      </Pressable>

      <View style={styles.grid}>
        {EXPLORE_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => void openCategory(cat)}
            style={[styles.tile, active?.id === cat.id && styles.tileActive]}>
            <Text style={styles.tileTitle}>{cat.title}</Text>
            <Text style={styles.tileHint}>{cat.hint}</Text>
            <Text style={styles.tileCta}>{strings.explore.openCategory}</Text>
          </Pressable>
        ))}
      </View>

      {active ? (
        <>
          <Text style={styles.section}>
            {strings.explore.rankings}: {active.title}
          </Text>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.sub}>{strings.explore.loading}</Text>
            </View>
          ) : ranking.length === 0 ? (
            <EmptyState title={strings.explore.empty} />
          ) : (
            ranking.map((p) => (
              <ProductCard
                key={p.barcode}
                name={p.name}
                brand={p.brand}
                imageUrl={p.imageUrl}
                scoreValue={p.score.value}
                scoreBand={p.score.band}
                onPress={() => router.push(`/product/${p.barcode}`)}
              />
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...typography.label, color: colors.secondary },
  title: { ...typography.title, color: colors.primary, marginTop: spacing.xs },
  sub: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  searchBanner: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  searchBannerText: { ...typography.bodyStrong, color: colors.white, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileActive: { borderColor: colors.primary },
  tileTitle: { ...typography.bodyStrong, color: colors.ink },
  tileHint: { ...typography.caption, color: colors.muted, marginTop: 4 },
  tileCta: { ...typography.caption, color: colors.secondary, marginTop: spacing.sm },
  section: { ...typography.subtitle, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.sm },
  loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
});
