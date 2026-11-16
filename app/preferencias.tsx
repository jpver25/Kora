import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import {
  DEFAULT_PREFERENCES,
  getDietaryPreferences,
  setDietaryPreferences,
  type DietaryPreferenceId,
  type DietaryPreferences,
} from '@/services/preferences';
import { colors, radii, spacing, typography } from '@/theme';

const IDS = Object.keys(DEFAULT_PREFERENCES) as DietaryPreferenceId[];

export default function PreferenciasScreen() {
  const [prefs, setPrefs] = useState<DietaryPreferences>({ ...DEFAULT_PREFERENCES });

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getDietaryPreferences().then((p) => {
        if (alive) setPrefs(p);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const toggle = (id: DietaryPreferenceId) => {
    setPrefs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const save = async () => {
    await setDietaryPreferences(prefs);
    Alert.alert(strings.preferences.saved);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.preferences.title,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        <Text style={styles.sub}>{strings.preferences.subtitle}</Text>
        {IDS.map((id) => (
          <Pressable
            key={id}
            onPress={() => toggle(id)}
            style={[styles.row, prefs[id] && styles.rowOn]}>
            <Text style={styles.rowText}>{strings.preferences.items[id]}</Text>
            <Text style={styles.check}>{prefs[id] ? '✓' : ''}</Text>
          </Pressable>
        ))}
        <Button label={strings.preferences.save} onPress={() => void save()} style={{ marginTop: spacing.lg }} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  sub: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  rowOn: { borderColor: colors.primary, backgroundColor: 'rgba(200,231,123,0.25)' },
  rowText: { ...typography.bodyStrong, color: colors.ink },
  check: { ...typography.subtitle, color: colors.primary },
});
