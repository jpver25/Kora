import { StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={styles.wrap}>
        <Text style={styles.title}>Esta pantalla no existe</Text>
        <Link href="/(tabs)" style={styles.link}>
          Volver al inicio
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.title, color: colors.primary },
  link: { ...typography.bodyStrong, color: colors.secondary, marginTop: spacing.md },
});
