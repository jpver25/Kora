import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies, radii, spacing, typography } from '@/theme';
import { strings } from '@/constants/strings.es';
import type { ScanMode } from '@/types/product';

type Props = {
  mode: ScanMode;
  onChange: (mode: ScanMode) => void;
};

const MODES: ScanMode[] = ['auto', 'barcode', 'visual'];

export function ScanModeSwitcher({ mode, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {MODES.map((m) => {
        const active = m === mode;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{strings.scan.modes[m]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(23,33,29,0.45)',
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
  },
  chipActive: { backgroundColor: colors.lime },
  label: { ...typography.caption, color: colors.white, fontFamily: fontFamilies.bodySemi },
  labelActive: { color: colors.ink },
});
