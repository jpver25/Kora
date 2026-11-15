import { StyleSheet, Text, View } from 'react-native';
import { colors, scoreBandColor, typography, type ScoreBand } from '@/theme';
import { strings } from '@/constants/strings.es';

type Props = {
  value: number | null;
  band: ScoreBand;
  size?: number;
};

export function ScoreRing({ value, band, size = 120 }: Props) {
  const color = scoreBandColor(band);
  const label = strings.product.bands[band];
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}>
      <Text style={[styles.value, { color, fontSize: size * 0.28 }]}>
        {value == null ? '—' : value}
      </Text>
      <Text style={[styles.band, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  value: {
    fontFamily: typography.hero.fontFamily,
    fontWeight: '700',
  },
  band: {
    ...typography.caption,
    fontFamily: typography.bodyStrong.fontFamily,
    marginTop: 2,
  },
});
