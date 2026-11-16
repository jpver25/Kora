import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { setOnboardingCompleted } from '@/services/onboarding';
import { getActiveVisionProvider } from '@/services/vision/ocr';
import { checkSupabaseHealth, type SupabaseHealth } from '@/services/supabaseHealth';
import { getAuthState, type AuthState } from '@/services/auth';
import { getCachedEntitlements, getScanUsage } from '@/services/entitlements';
import type { EntitlementSnapshot } from '@/types/entitlements';
import { colors, radii, spacing, typography } from '@/theme';

export default function PerfilScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const visionProvider = getActiveVisionProvider();
  const [health, setHealth] = useState<SupabaseHealth | null>(null);
  const [auth, setAuth] = useState<AuthState>({ session: null, user: null, isGuest: true });
  const [snap, setSnap] = useState<EntitlementSnapshot | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([
        checkSupabaseHealth(),
        getAuthState(),
        getCachedEntitlements(),
        getScanUsage(),
      ]).then(([h, a, e, u]) => {
        if (!alive) return;
        setHealth(h);
        setAuth(a);
        setSnap(e);
        setRemaining(Number.isFinite(u.remaining) ? u.remaining : null);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const supabaseCard = (() => {
    if (!health || health.status === 'missing_env') {
      return {
        warn: true,
        title: strings.profile.supabaseMissing,
        body: strings.profile.supabaseHint,
      };
    }
    if (health.status === 'live') {
      return { warn: false, title: strings.profile.supabaseLive, body: 'Proyecto enlazado y schema disponible.' };
    }
    if (health.status === 'live_no_schema') {
      return {
        warn: true,
        title: strings.profile.supabaseTablesMissing,
        body: strings.profile.supabaseTablesHint,
      };
    }
    return {
      warn: true,
      title: strings.profile.supabaseMissing,
      body: health.message,
    };
  })();

  return (
    <Screen scroll>
      <Text style={styles.brand}>{strings.appName}</Text>
      <Text style={styles.title}>{strings.profile.title}</Text>
      <Text style={styles.sub}>{strings.profile.subtitle}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {auth.isGuest
            ? strings.profile.guest
            : `${strings.profile.signedInAs}: ${auth.user?.email ?? auth.user?.id}`}
        </Text>
        <Text style={styles.cardBody}>
          {auth.isGuest
            ? strings.profile.guestHint
            : snap?.isPremium
              ? strings.premium.statusPremium
              : strings.premium.statusFree}
          {remaining != null ? ` · ${remaining} escaneos gratis hoy` : ''}
        </Text>
      </View>

      <Button
        label={strings.profile.openAccount}
        variant="lime"
        onPress={() => router.push('/cuenta')}
      />
      <Button
        label={strings.profile.openPremium}
        variant="secondary"
        onPress={() => router.push('/premium')}
        style={{ marginTop: spacing.sm }}
      />
      <Button
        label={strings.profile.openPreferences}
        variant="ghost"
        onPress={() => router.push('/preferencias')}
        style={{ marginTop: spacing.sm }}
      />
      <Button
        label={strings.profile.openSearch}
        variant="ghost"
        onPress={() => router.push('/buscar')}
        style={{ marginTop: spacing.sm }}
      />
      <Button
        label={strings.profile.openFavorites}
        variant="ghost"
        onPress={() => router.push({ pathname: '/(tabs)/historial', params: { favorites: '1' } })}
        style={{ marginTop: spacing.sm }}
      />
      <Button
        label={strings.profile.openContribute}
        variant="ghost"
        onPress={() =>
          router.push({ pathname: '/comunidad/contribuir', params: { source: 'missing_product' } })
        }
        style={{ marginTop: spacing.sm }}
      />
      <Button
        label={strings.profile.openCommunity}
        variant="ghost"
        onPress={() => router.push('/comunidad/actividad')}
        style={{ marginTop: spacing.sm, marginBottom: spacing.md }}
      />

      <View style={styles.card}>
        <Text style={styles.rowLabel}>{strings.profile.language}</Text>
        <Text style={styles.rowValue}>{strings.profile.languageValue}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.rowLabel}>{strings.profile.version}</Text>
        <Text style={styles.rowValue}>{version}</Text>
      </View>

      <View style={[styles.card, supabaseCard.warn && styles.warn]}>
        <Text style={styles.cardTitle}>{supabaseCard.title}</Text>
        <Text style={styles.cardBody}>{supabaseCard.body}</Text>
      </View>

      <View style={[styles.card, visionProvider === 'none' && styles.warn]}>
        <Text style={styles.cardTitle}>
          {visionProvider === 'none'
            ? strings.scan.visual.providerNone
            : `${strings.scan.visual.providerReady} (${visionProvider})`}
        </Text>
        <Text style={styles.cardBody}>{strings.scan.visualSoonBody}</Text>
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
