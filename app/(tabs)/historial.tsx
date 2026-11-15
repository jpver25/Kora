import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProductCard } from '@/components/product/ProductCard';
import { strings } from '@/constants/strings.es';
import { clearHistory, getHistory } from '@/services/history';
import type { HistoryEntry } from '@/types/product';
import { colors, spacing, typography } from '@/theme';

export default function HistorialScreen() {
  const [items, setItems] = useState<HistoryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHistory().then((list) => {
        if (alive) setItems(list);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const onClear = () => {
    Alert.alert(strings.history.clear, strings.history.empty, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: strings.history.clear,
        style: 'destructive',
        onPress: async () => {
          await clearHistory();
          setItems([]);
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <Text style={styles.brand}>{strings.appName}</Text>
      <Text style={styles.title}>{strings.history.title}</Text>

      {items.length === 0 ? (
        <EmptyState title={strings.history.empty} />
      ) : (
        <>
          {items.map((item) => (
            <ProductCard
              key={item.id}
              name={item.name}
              brand={item.brand}
              imageUrl={item.imageUrl}
              scoreValue={item.scoreValue}
              scoreBand={item.scoreBand}
              onPress={() => router.push(`/product/${item.barcode}`)}
            />
          ))}
          <Button
            label={strings.history.clear}
            variant="ghost"
            onPress={onClear}
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { ...typography.label, color: colors.secondary },
  title: { ...typography.title, color: colors.primary, marginBottom: spacing.md },
});
