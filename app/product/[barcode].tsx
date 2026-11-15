import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ScoreRing } from '@/components/ui/ScoreRing';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { lookupProductByBarcode } from '@/services/productLookup';
import type { Product } from '@/types/product';
import { colors, radii, spacing, typography } from '@/theme';

export default function ProductScreen() {
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!barcode) {
        setError(true);
        setLoading(false);
        return;
      }
      try {
        const found = await lookupProductByBarcode(String(barcode));
        if (!alive) return;
        setProduct(found);
        setError(!found);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [barcode]);

  return (
    <>
      <Stack.Screen
        options={{
          title: product?.name?.slice(0, 28) || strings.product.score,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loading}>{strings.common.loading}</Text>
          </View>
        ) : error || !product ? (
          <View style={styles.center}>
            <Text style={styles.notFoundTitle}>{strings.product.notFoundTitle}</Text>
            <Text style={styles.notFoundBody}>{strings.product.notFoundBody}</Text>
            <Button label={strings.product.retry} onPress={() => router.replace('/(tabs)/escanear')} />
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
              ) : (
                <View style={[styles.image, styles.imageFallback]} />
              )}
              <ScoreRing value={product.score.value} band={product.score.band} />
            </View>

            <Text style={styles.name}>{product.name}</Text>
            {product.brand ? <Text style={styles.brand}>{product.brand}</Text> : null}
            <Text style={styles.meta}>
              {strings.product.barcode}: {product.barcode}
            </Text>
            <Text style={styles.meta}>
              {strings.product.source}: {product.source}
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{strings.product.score}</Text>
              {product.score.explanation.map((line) => (
                <Text key={line} style={styles.line}>
                  • {line}
                </Text>
              ))}
            </View>

            {product.ingredientsText ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{strings.product.ingredients}</Text>
                <Text style={styles.line}>{product.ingredientsText}</Text>
              </View>
            ) : null}

            {product.additives.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{strings.product.additives}</Text>
                <Text style={styles.line}>
                  {product.additives.map((a) => a.code).join(' · ')}
                </Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{strings.product.nutriments}</Text>
              <NutriRow label="Energía" value={product.nutriments.energyKcal100g} unit="kcal" />
              <NutriRow label="Grasas" value={product.nutriments.fat100g} unit="g" />
              <NutriRow label="Azúcares" value={product.nutriments.sugars100g} unit="g" />
              <NutriRow label="Sal" value={product.nutriments.salt100g} unit="g" />
              <NutriRow label="Proteínas" value={product.nutriments.proteins100g} unit="g" />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{strings.product.alternatives}</Text>
              <Image
                source={require('@/assets/images/brand/alt-choco.png')}
                style={styles.altArt}
                resizeMode="contain"
              />
              <Text style={styles.line}>{strings.product.alternativesSoon}</Text>
            </View>

            <Button
              label={strings.product.retry}
              variant="secondary"
              onPress={() => router.replace('/(tabs)/escanear')}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

function NutriRow({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number | null;
  unit: string;
}) {
  return (
    <View style={styles.nutriRow}>
      <Text style={styles.nutriLabel}>{label}</Text>
      <Text style={styles.nutriValue}>
        {value == null ? strings.product.unknown : `${value} ${unit} / 100g`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  loading: { ...typography.body, color: colors.muted },
  notFoundTitle: { ...typography.title, color: colors.primary, textAlign: 'center' },
  notFoundBody: { ...typography.body, color: colors.muted, textAlign: 'center' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  imageFallback: { backgroundColor: colors.border },
  name: { ...typography.title, color: colors.ink },
  brand: { ...typography.subtitle, color: colors.secondary, marginTop: 4 },
  meta: { ...typography.caption, color: colors.muted, marginTop: 4 },
  section: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  sectionTitle: { ...typography.bodyStrong, color: colors.primary, marginBottom: 4 },
  line: { ...typography.body, color: colors.ink },
  nutriRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  nutriLabel: { ...typography.body, color: colors.muted },
  nutriValue: { ...typography.bodyStrong, color: colors.ink },
  altArt: { width: '100%', height: 140, marginVertical: spacing.sm },
});
