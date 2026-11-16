import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { getAuthState } from '@/services/auth';
import {
  getEntitlements,
  getScanUsage,
  FREE_DAILY_SCAN_LIMIT,
} from '@/services/entitlements';
import {
  getOfferings,
  getPurchaseEnvironment,
  purchasePackage,
  restorePurchases,
  type OfferingPackageInfo,
  type PurchaseEnvironment,
} from '@/services/purchases';
import {
  downloadOfflineCatalogPackage,
  getOfflinePackageMeta,
  type OfflinePackageMeta,
} from '@/services/offlineCache';
import type { EntitlementSnapshot } from '@/types/entitlements';
import { colors, radii, spacing, typography } from '@/theme';

export default function PremiumScreen() {
  const [snap, setSnap] = useState<EntitlementSnapshot | null>(null);
  const [env, setEnv] = useState<PurchaseEnvironment | null>(null);
  const [offerings, setOfferings] = useState<OfferingPackageInfo[]>([]);
  const [usage, setUsage] = useState<{ remaining: number; limit: number } | null>(null);
  const [offline, setOffline] = useState<OfflinePackageMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const auth = await getAuthState();
    setUserId(auth.user?.id ?? null);
    const e = getPurchaseEnvironment();
    setEnv(e);
    const entitlements = await getEntitlements(auth.user?.id);
    setSnap(entitlements);
    setUsage(await getScanUsage());
    setOffline(await getOfflinePackageMeta());
    setOfferings(await getOfferings());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const onBuy = async (id: string) => {
    setBusy(true);
    try {
      const result = await purchasePackage(id);
      if (!result.ok) {
        if (result.reason !== 'cancelled') {
          Alert.alert(strings.common.error, result.reason);
        }
        return;
      }
      if (!result.isPremium) {
        Alert.alert(strings.premium.title, strings.premium.notPremiumAfterPurchase);
      }
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const result = await restorePurchases();
      if (!result.ok) {
        Alert.alert(strings.common.error, result.reason);
        return;
      }
      Alert.alert(
        strings.premium.restored,
        result.isPremium ? strings.premium.statusPremium : strings.premium.statusFree,
      );
      await reload();
    } finally {
      setBusy(false);
    }
  };

  const onOffline = async () => {
    setBusy(true);
    try {
      const current = snap ?? (await getEntitlements(userId));
      const meta = await downloadOfflineCatalogPackage(current);
      setOffline(meta);
      Alert.alert(strings.premium.offlineTitle, meta.note);
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = snap?.isPremium
    ? strings.premium.statusPremium
    : snap?.reason
      ? strings.premium.statusUnknown
      : strings.premium.statusFree;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.premium.title,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sub}>{strings.premium.subtitle}</Text>

        <View style={[styles.card, snap?.isPremium ? styles.premiumCard : undefined]}>
          <Text style={styles.cardTitle}>{statusLabel}</Text>
          <Text style={styles.cardBody}>{strings.premium.noFake}</Text>
          {usage && Number.isFinite(usage.limit) ? (
            <Text style={styles.cardBody}>
              Escaneos gratis hoy: {usage.remaining}/{FREE_DAILY_SCAN_LIMIT} restantes
            </Text>
          ) : null}
          {snap?.productId ? (
            <Text style={styles.cardBody}>Producto: {snap.productId}</Text>
          ) : null}
        </View>

        {env && !env.canPurchase ? (
          <View style={[styles.card, styles.warn]}>
            <Text style={styles.cardTitle}>{strings.premium.expoGoBlock}</Text>
            <Text style={styles.cardBody}>{env.reasonSpanish}</Text>
          </View>
        ) : null}

        <Text style={styles.section}>{strings.premium.freeFeaturesTitle}</Text>
        {strings.premium.freeFeatures.map((f) => (
          <Text key={f} style={styles.bullet}>
            • {f}
          </Text>
        ))}

        <Text style={styles.section}>{strings.premium.premiumFeaturesTitle}</Text>
        {strings.premium.premiumFeatures.map((f) => (
          <Text key={f} style={styles.bullet}>
            • {f}
          </Text>
        ))}

        <Text style={styles.section}>{strings.premium.offlineTitle}</Text>
        <Text style={styles.cardBody}>
          {offline?.note ?? strings.premium.offlineHint}
        </Text>
        <Button
          label={strings.premium.downloadOffline}
          variant="ghost"
          loading={busy}
          onPress={() => void onOffline()}
          style={{ marginTop: spacing.sm }}
        />

        {offerings.length === 0 ? (
          <Text style={[styles.cardBody, { marginTop: spacing.md }]}>
            {strings.premium.offeringsEmpty}
          </Text>
        ) : (
          offerings.map((o) => (
            <View key={o.identifier} style={styles.offer}>
              <Text style={styles.cardTitle}>
                {o.title} — {o.priceString}
              </Text>
              <Text style={styles.cardBody}>{o.description}</Text>
              <Button
                label={strings.premium.buy}
                loading={busy}
                onPress={() => void onBuy(o.identifier)}
                style={{ marginTop: spacing.sm }}
              />
            </View>
          ))
        )}

        <Button
          label={strings.premium.restore}
          variant="secondary"
          loading={busy}
          onPress={() => void onRestore()}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.cream },
  sub: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: 4,
  },
  premiumCard: { borderColor: colors.lime, backgroundColor: '#F4FBE3' },
  warn: { borderColor: colors.warning, backgroundColor: '#FFF7EB' },
  cardTitle: { ...typography.bodyStrong, color: colors.ink },
  cardBody: { ...typography.body, color: colors.muted },
  section: { ...typography.subtitle, color: colors.primary, marginTop: spacing.md },
  bullet: { ...typography.body, color: colors.ink, marginTop: 4 },
  offer: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
});
