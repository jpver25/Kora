import { Image, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { strings } from '@/constants/strings.es';
import { colors, radii, spacing, typography } from '@/theme';

export default function ExplorarScreen() {
  return (
    <Screen scroll>
      <Text style={styles.brand}>{strings.appName}</Text>
      <Text style={styles.title}>{strings.explore.title}</Text>
      <Text style={styles.sub}>{strings.explore.subtitle}</Text>

      <Image
        source={require('@/assets/images/brand/onboarding-analisis-v2.png')}
        style={styles.banner}
        resizeMode="cover"
      />

      <View style={styles.grid}>
        {strings.explore.categories.map((cat) => (
          <View key={cat.id} style={styles.tile}>
            <Text style={styles.tileTitle}>{cat.title}</Text>
            <Text style={styles.tileHint}>{cat.hint}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>{strings.explore.coming}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...typography.label, color: colors.secondary },
  title: { ...typography.title, color: colors.primary, marginTop: spacing.xs },
  sub: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  banner: {
    width: '100%',
    height: 200,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
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
  tileTitle: { ...typography.bodyStrong, color: colors.ink },
  tileHint: { ...typography.caption, color: colors.muted, marginTop: 4 },
  note: { ...typography.caption, color: colors.muted, marginTop: spacing.lg },
});
