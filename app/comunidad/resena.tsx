import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { submitCosmeticReview } from '@/services/communityStore';
import { colors, radii, spacing, typography } from '@/theme';

export default function ResenaScreen() {
  const params = useLocalSearchParams<{ barcode?: string }>();
  const barcode = String(params.barcode ?? '');
  const [stars, setStars] = useState(5);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const result = await submitCosmeticReview({ barcode, stars, body });
      if (!result.ok) {
        Alert.alert(strings.common.error, result.reason);
        return;
      }
      Alert.alert(
        strings.appName,
        [
          strings.community.submitted,
          result.localOnly ? strings.community.localQueue : null,
          `${strings.community.status}: ${strings.community.statuses[result.status]}`,
          strings.product.reviewsScientificNote,
        ]
          .filter(Boolean)
          .join('\n'),
        [{ text: strings.common.ok, onPress: () => router.back() }],
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.product.writeReview,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        <Text style={styles.note}>{strings.product.reviewsScientificNote}</Text>
        <Text style={styles.label}>{strings.community.stars}</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => setStars(n)} style={[styles.star, stars >= n && styles.starOn]}>
              <Text style={styles.starText}>{n}★</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>{strings.community.reviewBody}</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          style={[styles.input, styles.multi]}
          multiline
          placeholder="Ej: textura, olor, irritación…"
          placeholderTextColor={colors.muted}
        />
        <Button
          label={strings.community.submit}
          loading={busy}
          onPress={() => void submit()}
          style={{ marginTop: spacing.lg }}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  note: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  label: { ...typography.label, color: colors.secondary, marginTop: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  star: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  starOn: { backgroundColor: colors.lime, borderColor: colors.primary },
  starText: { ...typography.bodyStrong, color: colors.ink },
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
  multi: { minHeight: 120, textAlignVertical: 'top' },
});
