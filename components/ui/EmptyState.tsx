import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/theme';

type Props = {
  title: string;
  body?: string;
};

export function EmptyState({ title, body }: Props) {
  return (
    <View style={styles.wrap}>
      <Image
        source={require('@/assets/images/brand/mascot-plain.png')}
        style={styles.mascot}
        resizeMode="contain"
      />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  mascot: { width: 120, height: 120, marginBottom: spacing.sm },
  title: { ...typography.subtitle, color: colors.ink, textAlign: 'center' },
  body: { ...typography.body, color: colors.muted, textAlign: 'center', maxWidth: 320 },
});
