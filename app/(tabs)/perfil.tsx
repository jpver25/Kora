import { Alert, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { setOnboardingCompleted } from '@/services/onboarding';
import { isSupabaseConfigured } from '@/services/supabase';
import { colors, radii, spacing, typography } from '@/theme';

export default function PerfilScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen scroll>
      <Text style={styles.brand}>{strings.appName}</Text>
      <Text style={styles.title}>{strings.profile.title}</Text>
      <Text style={styles.sub}>{strings.profile.subtitle}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{strings.profile.guest}</Text>
        <Text style={styles.cardBody}>{strings.profile.guestHint}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowLabel}>{strings.profile.language}</Text>
        <Text style={styles.rowValue}>{strings.profile.languageValue}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowLabel}>{strings.profile.version}</Text>
        <Text style={styles.rowValue}>{version}</Text>
      </View>

      <View style={[styles.card, !isSupabaseConfigured && styles.warn]}>
        <Text style={styles.cardTitle}>
          {isSupabaseConfigured ? 'Supabase conectado' : strings.profile.supabaseMissing}
        </Text>
        {!isSupabaseConfigured ? (
          <Text style={styles.cardBody}>{strings.profile.supabaseHint}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{strings.profile.about}</Text>
        <Text style={styles.cardBody}>{strings.profile.aboutBody}</Text>
      </View>

      <Button
        label={strings.profile.resetOnboarding}
        variant="ghost"
        onPress={() => {
          Alert.alert(strings.profile.resetOnboarding, undefined, [
            { text: strings.common.cancel, style: 'cancel' },
            {
              text: strings.common.ok,
              onPress: async () => {
                await setOnboardingCompleted(false);
                router.replace('/onboarding');
              },
            },
          ]);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...typography.label, color: colors.secondary },
  title: { ...typography.title, color: colors.primary },
  sub: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  warn: { borderColor: colors.warning, backgroundColor: '#FFF7EB' },
  cardTitle: { ...typography.bodyStrong, color: colors.ink },
  cardBody: { ...typography.body, color: colors.muted },
  rowLabel: { ...typography.caption, color: colors.muted },
  rowValue: { ...typography.bodyStrong, color: colors.ink },
});
