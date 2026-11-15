import { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product/ProductCard';
import { strings } from '@/constants/strings.es';
import { getHistory } from '@/services/history';
import { getFavorites } from '@/services/favorites';
import type { HistoryEntry } from '@/types/product';
import { colors, radii, spacing, typography } from '@/theme';

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return strings.home.greetingMorning;
  if (h < 20) return strings.home.greetingAfternoon;
  return strings.home.greetingEvening;
}

export default function HomeScreen() {
  const [recent, setRecent] = useState<HistoryEntry[]>([]);
  const [favCount, setFavCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([getHistory(), getFavorites()]).then(([items, favs]) => {
        if (!alive) return;
        setRecent(items.slice(0, 5));
        setFavCount(favs.length);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const recommendations = useMemo(() => {
    return [...recent]
      .filter((r) => r.scoreValue != null)
      .sort((a, b) => (b.scoreValue ?? 0) - (a.scoreValue ?? 0))
      .slice(0, 3);
  }, [recent]);

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.brand}>{strings.appName}</Text>
          <Text style={styles.greet}>{greetingForNow()}</Text>
          <Text style={styles.headline}>{strings.home.headline}</Text>
          <Text style={styles.subhead}>{strings.home.subhead}</Text>
        </View>
        <Image
          source={require('@/assets/images/brand/mascot-plain.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(80).duration(450)}>
        <Button
          label={strings.home.ctaScan}
          onPress={() => router.push('/(tabs)/escanear')}
          variant="primary"
        />
      </Animated.View>

      <Text style={styles.section}>{strings.home.shortcuts}</Text>
      <View style={styles.shortcuts}>
        <Shortcut label={strings.home.search} onPress={() => router.push('/buscar')} />
        <Shortcut
          label={`${strings.home.favorites}${favCount ? ` (${favCount})` : ''}`}
          onPress={() => router.push({ pathname: '/(tabs)/historial', params: { favorites: '1' } })}
        />
        <Shortcut label={strings.home.preferences} onPress={() => router.push('/preferencias')} />
      </View>

      <View style={styles.tip}>
        <Text style={styles.tipLabel}>{strings.home.tipTitle}</Text>
        <Text style={styles.tipBody}>{strings.home.tipBody}</Text>
      </View>

      <Text style={styles.section}>{strings.home.recommendations}</Text>
      {recommendations.length === 0 ? (
        <Text style={styles.empty}>{strings.home.recommendationsEmpty}</Text>
      ) : (
        <>
          <Text style={styles.hint}>{strings.home.recommendationsHint}</Text>
          {recommendations.map((item) => (
            <ProductCard
              key={`rec-${item.id}`}
              name={item.name}
              brand={item.brand}
              imageUrl={item.imageUrl}
              scoreValue={item.scoreValue}
              scoreBand={item.scoreBand}
              onPress={() => router.push(`/product/${item.barcode}`)}
            />
          ))}
        </>
      )}

      <Text style={styles.section}>{strings.home.recent}</Text>
      {recent.length === 0 ? (
        <Text style={styles.empty}>{strings.home.emptyRecent}</Text>
      ) : (
        recent.map((item) => (
          <ProductCard
            key={item.id}
            name={item.name}
            brand={item.brand}
            imageUrl={item.imageUrl}
            scoreValue={item.scoreValue}
            scoreBand={item.scoreBand}
            onPress={() => router.push(`/product/${item.barcode}`)}
          />
        ))
      )}
    </Screen>
  );
}

function Shortcut({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shortcut, pressed && { opacity: 0.85 }]}>
      <Text style={styles.shortcutText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroText: { flex: 1, gap: spacing.xs },
  brand: { ...typography.label, color: colors.secondary },
  greet: { ...typography.caption, color: colors.muted },
  headline: { ...typography.title, color: colors.primary },
  subhead: { ...typography.body, color: colors.muted },
  mascot: { width: 110, height: 110 },
  tip: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(200, 231, 123, 0.35)',
  },
  tipLabel: { ...typography.label, color: colors.primary, marginBottom: 4 },
  tipBody: { ...typography.body, color: colors.ink },
  section: { ...typography.subtitle, color: colors.ink, marginTop: spacing.md },
  hint: { ...typography.caption, color: colors.muted, marginTop: 4, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.sm },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  shortcut: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutText: { ...typography.bodyStrong, color: colors.primary },
});
