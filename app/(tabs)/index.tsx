import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product/ProductCard';
import { strings } from '@/constants/strings.es';
import { getHistory } from '@/services/history';
import type { HistoryEntry } from '@/types/product';
import { colors, radii, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const [recent, setRecent] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHistory().then((items) => {
        if (alive) setRecent(items.slice(0, 5));
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.brand}>{strings.appName}</Text>
          <Text style={styles.headline}>{strings.home.headline}</Text>
          <Text style={styles.subhead}>{strings.home.subhead}</Text>
        </View>
        <Image
          source={require('@/assets/images/brand/mascot-plain.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(120).duration(450)}>
        <Button
          label={strings.home.ctaScan}
          onPress={() => router.push('/(tabs)/escanear')}
          variant="primary"
        />
      </Animated.View>

      <View style={styles.tip}>
        <Text style={styles.tipLabel}>{strings.home.tipTitle}</Text>
        <Text style={styles.tipBody}>{strings.home.tipBody}</Text>
      </View>

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

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  heroText: { flex: 1, gap: spacing.sm },
  brand: { ...typography.label, color: colors.secondary },
  headline: { ...typography.title, color: colors.primary },
  subhead: { ...typography.body, color: colors.muted },
  mascot: { width: 110, height: 110 },
  tip: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(200, 231, 123, 0.35)',
  },
  tipLabel: { ...typography.label, color: colors.primary, marginBottom: 4 },
  tipBody: { ...typography.body, color: colors.ink },
  section: { ...typography.subtitle, color: colors.ink, marginTop: spacing.md },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.sm },
});
