import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import { submitProductCorrection } from '@/services/communityStore';
import { colors, radii, spacing, typography } from '@/theme';

const FIELDS = [
  { id: 'name', label: strings.community.name },
  { id: 'brand', label: strings.community.brand },
  { id: 'ingredients', label: strings.product.ingredients },
  { id: 'category', label: strings.community.category },
  { id: 'other', label: 'Otro' },
];

export default function CorregirScreen() {
  const params = useLocalSearchParams<{
    barcode?: string;
    name?: string;
    brand?: string;
  }>();
  const barcode = String(params.barcode ?? '');
  const [field, setField] = useState('name');
  const [currentValue, setCurrentValue] = useState(
    field === 'brand' ? String(params.brand ?? '') : String(params.name ?? ''),
  );
  const [proposedValue, setProposedValue] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const onField = (id: string) => {
    setField(id);
    if (id === 'name') setCurrentValue(String(params.name ?? ''));
    else if (id === 'brand') setCurrentValue(String(params.brand ?? ''));
    else setCurrentValue('');
  };

  const submit = async () => {
    if (!barcode || !proposedValue.trim()) {
      Alert.alert(strings.common.error, strings.community.proposedValue);
      return;
    }
    setBusy(true);
    try {
      const result = await submitProductCorrection({
        barcode,
        field,
        currentValue: currentValue.trim() || undefined,
        proposedValue: proposedValue.trim(),
        reason: reason.trim() || undefined,
      });
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
          title: strings.community.correctionTitle,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        <Text style={styles.sub}>{strings.community.correctionSubtitle}</Text>
        <Text style={styles.meta}>
          {strings.product.barcode}: {barcode || '—'}
        </Text>

        <Text style={styles.label}>{strings.community.field}</Text>
        <View style={styles.row}>
          {FIELDS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => onField(f.id)}
              style={[styles.chip, field === f.id && styles.chipOn]}>
              <Text style={[styles.chipText, field === f.id && styles.chipTextOn]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{strings.community.currentValue}</Text>
        <TextInput value={currentValue} onChangeText={setCurrentValue} style={styles.input} />

        <Text style={styles.label}>{strings.community.proposedValue}</Text>
        <TextInput value={proposedValue} onChangeText={setProposedValue} style={styles.input} />

        <Text style={styles.label}>{strings.community.reason}</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
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
  meta: { ...typography.caption, color: colors.secondary, marginTop: spacing.sm },
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
  multi: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.ink },
  chipTextOn: { color: colors.white },
});
