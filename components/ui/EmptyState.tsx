import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  body?: string;
};

export function EmptyState({ title, body }: Props) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={body ? `${title}. ${body}` : title}>
      <Image
        source={require('@/assets/images/brand/mascot-plain.png')}
        style={styles.mascot}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
      <Text style={styles.title} maxFontSizeMultiplier={1.4}>
        {title}
      </Text>
      {body ? (
        <Text style={styles.body} maxFontSizeMultiplier={1.5}>
          {body}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  mascot: { width: 120, height: 120, marginBottom: spacing.sm },
  title: { ...typography.subtitle, color: colors.ink, textAlign: 'center' },
  body: { ...typography.body, color: colors.muted, textAlign: 'center', maxWidth: 320 },
});
