import { StyleSheet, View } from 'react-native';
import { colors, radii } from '@/theme';

export function ScanFrame() {
  return (
    <View style={styles.frame}>
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
    </View>
  );
}

const ARM = 28;
const THICK = 4;

const styles = StyleSheet.create({
  frame: {
    width: 260,
    height: 180,
    borderRadius: radii.md,
  },
  corner: {
    position: 'absolute',
    width: ARM,
    height: ARM,
    borderColor: colors.lime,
  },
  tl: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 12 },
  tr: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 12 },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: THICK,
    borderLeftWidth: THICK,
    borderBottomLeftRadius: 12,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: THICK,
    borderRightWidth: THICK,
    borderBottomRightRadius: 12,
  },
});
