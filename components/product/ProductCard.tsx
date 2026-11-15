import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, scoreBandColor, spacing, typography, type ScoreBand } from '@/theme';

type Props = {
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  scoreValue: number | null;
  scoreBand: ScoreBand;
  onPress?: () => void;
};

export function ProductCard({ name, brand, imageUrl, scoreValue, scoreBand, onPress }: Props) {
  const accent = scoreBandColor(scoreBand);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={styles.thumbWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumb} resizeMode="contain" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]} />
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        {brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {brand}
          </Text>
        ) : null}
      </View>
      <View style={[styles.badge, { backgroundColor: accent }]}>
        <Text style={styles.badgeText}>{scoreValue ?? '—'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: colors.border },
  meta: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.ink },
  brand: { ...typography.caption, color: colors.muted },
  badge: {
    minWidth: 42,
    height: 42,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: { ...typography.bodyStrong, color: colors.white },
});
