import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { addHistoryFromProduct } from '@/services/history';
import { lookupProductByBarcode } from '@/services/productLookup';
import { colors, radii, spacing, typography } from '@/theme';

type ParamCandidate = {
  barcode: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  score: number;
};

export default function VisualCandidatesScreen() {
  const params = useLocalSearchParams<{ payload?: string; message?: string }>();
  let candidates: ParamCandidate[] = [];
  try {
    candidates = params.payload ? (JSON.parse(String(params.payload)) as ParamCandidate[]) : [];
  } catch {
    candidates = [];
  }
  const message = params.message ? String(params.message) : strings.scan.visual.pickTitle;

  const onPick = async (item: ParamCandidate) => {
    const product = await lookupProductByBarcode(item.barcode);
    if (!product) {
      Alert.alert(strings.product.notFoundTitle, strings.product.notFoundBody, [
        {
          text: strings.scan.visual.helpCta,
          onPress: () =>
            router.push({
              pathname: '/comunidad/contribuir',
              params: { source: 'failed_visual', barcode: item.barcode },
            }),
        },
        { text: strings.common.ok },
      ]);
      return;
    }
    await addHistoryFromProduct(product, 'visual');
    router.replace(`/product/${product.barcode}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.scan.visual.pickTitle,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <Text style={styles.message}>{message}</Text>
        <FlatList
          data={candidates}
          keyExtractor={(item) => item.barcode}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
              <Text style={styles.empty}>{strings.scan.visual.noMatch}</Text>
              <Button
                label={strings.scan.visual.helpCta}
                onPress={() =>
                  router.push({
                    pathname: '/comunidad/contribuir',
                    params: { source: 'failed_visual' },
                  })
                }
              />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              onPress={() => void onPick(item)}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="contain" />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]} />
              )}
              <View style={styles.meta}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.brand ? (
                  <Text style={styles.brand} numberOfLines={1}>
                    {item.brand}
                  </Text>
                ) : null}
                <Text style={styles.score}>
                  {strings.scan.visual.confidence}: {Math.round(item.score * 100)}%
                </Text>
              </View>
            </Pressable>
          )}
        />
        <Button
          label={strings.product.retry}
          variant="ghost"
          onPress={() => router.replace('/(tabs)/escanear')}
          style={{ margin: spacing.lg }}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  message: {
    ...typography.body,
    color: colors.muted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  list: { padding: spacing.lg, gap: spacing.sm },
  empty: { ...typography.body, color: colors.muted, textAlign: 'center', marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  thumb: { width: 64, height: 64, borderRadius: radii.sm, backgroundColor: colors.surface },
  thumbFallback: { backgroundColor: colors.border },
  meta: { flex: 1, gap: 2 },
  name: { ...typography.bodyStrong, color: colors.ink },
  brand: { ...typography.caption, color: colors.muted },
  score: { ...typography.caption, color: colors.secondary, marginTop: 4 },
});
