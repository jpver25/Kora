import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/product/ProductCard';
import { strings } from '@/constants/strings.es';
import { searchCatalog, type CatalogKind } from '@/services/catalogSearch';
import type { Product } from '@/types/product';
import { colors, radii, spacing, typography } from '@/theme';

const KINDS: { id: CatalogKind; label: string }[] = [
  { id: 'all', label: strings.search.kindAll },
  { id: 'food', label: strings.search.kindFood },
  { id: 'beauty', label: strings.search.kindBeauty },
];

export default function BuscarScreen() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<CatalogKind>('all');
  const [minScore, setMinScore] = useState('0');
  const [maxScore, setMaxScore] = useState('100');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[] | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const min = Number(minScore);
      const max = Number(maxScore);
      const list = await searchCatalog({
        query,
        kind,
        minScore: Number.isFinite(min) ? min : null,
        maxScore: Number.isFinite(max) ? max : null,
      });
      setResults(list);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.search.title,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={strings.search.placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => void run()}
        />
        <Text style={styles.hint}>{strings.search.barcodeHint}</Text>

        <Text style={styles.label}>{strings.search.filters}</Text>
        <View style={styles.row}>
          {KINDS.map((k) => (
            <Pressable
              key={k.id}
              onPress={() => setKind(k.id)}
              style={[styles.chip, kind === k.id && styles.chipActive]}>
              <Text style={[styles.chipText, kind === k.id && styles.chipTextActive]}>{k.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.scoreRow}>
          <View style={styles.scoreField}>
            <Text style={styles.label}>{strings.search.scoreMin}</Text>
            <TextInput
              value={minScore}
              onChangeText={setMinScore}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
          <View style={styles.scoreField}>
            <Text style={styles.label}>{strings.search.scoreMax}</Text>
            <TextInput
              value={maxScore}
              onChangeText={setMaxScore}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <Button label={strings.search.submit} onPress={() => void run()} loading={loading} />

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}

        {results && !loading ? (
          results.length === 0 ? (
            <Text style={styles.empty}>{query.trim() ? strings.search.noResults : strings.search.empty}</Text>
          ) : (
            results.map((p) => (
              <ProductCard
                key={p.barcode}
                name={p.name}
                brand={p.brand}
                imageUrl={p.imageUrl}
                scoreValue={p.score.value}
                scoreBand={p.score.band}
                onPress={() => router.push(`/product/${p.barcode}`)}
              />
            ))
          )
        ) : null}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    ...typography.body,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  hint: { ...typography.caption, color: colors.muted, marginTop: 6 },
  label: { ...typography.label, color: colors.secondary, marginTop: spacing.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.ink, fontFamily: typography.bodyStrong.fontFamily },
  chipTextActive: { color: colors.white },
  scoreRow: { flexDirection: 'row', gap: spacing.md },
  scoreField: { flex: 1 },
  empty: { ...typography.body, color: colors.muted, marginTop: spacing.lg },
});
