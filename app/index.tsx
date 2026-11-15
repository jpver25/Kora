import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { hasCompletedOnboarding } from '@/services/onboarding';
import { colors, typography, spacing } from '@/theme';
import { strings } from '@/constants/strings.es';

export default function GateScreen() {
  const [ready, setReady] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const done = await hasCompletedOnboarding();
      if (!alive) return;
      setSeenOnboarding(done);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) {
    return (
      <LinearGradient colors={[colors.primary, '#0F2A25']} style={styles.splash}>
        <Image
          source={require('@/assets/images/brand/mascot-plain.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        <Text style={styles.brand}>{strings.appName}</Text>
        <Text style={styles.tag}>{strings.slogan}</Text>
        <ActivityIndicator color={colors.lime} style={{ marginTop: spacing.lg }} />
      </LinearGradient>
    );
  }

  if (!seenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  mascot: { width: 180, height: 180 },
  brand: {
    ...typography.hero,
    color: colors.lime,
    marginTop: spacing.md,
  },
  tag: {
    ...typography.body,
    color: colors.cream,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
