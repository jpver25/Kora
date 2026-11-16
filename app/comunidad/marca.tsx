import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { submitBrandImprovementRequest } from '@/services/communityStore';
import { colors, radii, spacing, typography } from '@/theme';

export default function MarcaScreen() {
  const params = useLocalSearchParams<{ brand?: string; barcode?: string }>();
  const [brand, setBrand] = useState(String(params.brand ?? ''));
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const result = await submitBrandImprovementRequest({
        brand,
        barcode: params.barcode ? String(params.barcode) : undefined,
        message,
      });
      if (!result.ok) {
        const reason =
          result.reason === 'rate_limited'
            ? strings.community.rateLimited
            : result.reason;
        Alert.alert(strings.common.error, reason);
        return;
      }
      Alert.alert(
        strings.appName,
        [
          strings.community.submitted,
          result.localOnly ? strings.community.localQueue : null,
          `${strings.community.status}: ${strings.community.statuses[result.status]}`,
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
          title: strings.community.brandTitle,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        <Text style={styles.sub}>{strings.community.brandSubtitle}</Text>
        <Text style={styles.label}>{strings.community.brand}</Text>
        <TextInput value={brand} onChangeText={setBrand} style={styles.input} />
        <Text style={styles.label}>{strings.community.message}</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          style={[styles.input, styles.multi]}
          multiline
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
  sub: { ...typography.body, color: colors.muted },
  label: { ...typography.label, color: colors.secondary, marginTop: spacing.md },
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
