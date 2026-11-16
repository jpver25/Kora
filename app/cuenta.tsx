import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Share,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Button } from '@/components/ui/Button';
import { strings } from '@/constants/strings.es';
import {
  exportAccountData,
  getAuthState,
  isAppleAuthAvailable,
  requestAccountDeletion,
  signInWithApple,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateDisplayName,
  type AuthState,
} from '@/services/auth';
import { configurePurchases } from '@/services/purchases';
import { refreshEntitlements } from '@/services/entitlements';
import { colors, radii, spacing, typography } from '@/theme';

export default function CuentaScreen() {
  const [auth, setAuth] = useState<AuthState>({ session: null, user: null, isGuest: true });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [appleOk, setAppleOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const state = await getAuthState();
    setAuth(state);
    setDisplayName((state.user?.user_metadata?.display_name as string) || '');
    setAppleOk(await isAppleAuthAvailable());
    if (state.user) {
      await configurePurchases(state.user.id);
      await refreshEntitlements(state.user.id);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await reload();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : strings.common.error;
      Alert.alert(strings.common.error, msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: strings.auth.title,
          headerStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.primary,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sub}>{strings.auth.subtitle}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {auth.isGuest
              ? strings.profile.guest
              : `${strings.profile.signedInAs}: ${auth.user?.email ?? auth.user?.id}`}
          </Text>
          <Text style={styles.cardBody}>
            {auth.isGuest ? strings.profile.guestHint : strings.auth.loggedIn}
          </Text>
        </View>

        {auth.isGuest ? (
          <>
            <Text style={styles.label}>{strings.auth.email}</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <Text style={styles.label}>{strings.auth.password}</Text>
            <TextInput
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <Text style={styles.label}>{strings.auth.displayName}</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} />

            <Button
              label={strings.auth.signIn}
              loading={busy}
              onPress={() =>
                void run(async () => {
                  await signInWithEmail(email, password);
                  Alert.alert(strings.auth.loggedIn, strings.auth.migrated);
                })
              }
              style={{ marginTop: spacing.md }}
            />
            <Button
              label={strings.auth.signUp}
              variant="secondary"
              loading={busy}
              onPress={() =>
                void run(async () => {
                  await signUpWithEmail(email, password, displayName);
                  Alert.alert(strings.auth.loggedIn, strings.auth.migrated);
                })
              }
              style={{ marginTop: spacing.sm }}
            />

            {Platform.OS === 'ios' && appleOk ? (
              <View style={{ marginTop: spacing.md }}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={{ width: '100%', height: 44 }}
                  onPress={() =>
                    void run(async () => {
                      await signInWithApple();
                      Alert.alert(strings.auth.loggedIn, strings.auth.migrated);
                    })
                  }
                />
              </View>
            ) : (
              <Text style={styles.hint}>{strings.auth.appleUnavailable}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>{strings.auth.displayName}</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} />
            <Button
              label={strings.auth.saveProfile}
              loading={busy}
              onPress={() =>
                void run(async () => {
                  await updateDisplayName(displayName);
                  Alert.alert(strings.auth.profileSaved);
                })
              }
              style={{ marginTop: spacing.md }}
            />
            <Button
              label={strings.profile.openPremium}
              variant="lime"
              onPress={() => router.push('/premium')}
              style={{ marginTop: spacing.sm }}
            />
            <Button
              label={strings.profile.exportData}
              variant="ghost"
              onPress={() =>
                void run(async () => {
                  const data = await exportAccountData();
                  await Share.share({
                    message: JSON.stringify(data, null, 2),
                    title: strings.auth.exportTitle,
                  });
                })
              }
              style={{ marginTop: spacing.sm }}
            />
            <Button
              label={strings.profile.logout}
              variant="ghost"
              onPress={() => {
                Alert.alert(strings.profile.logout, strings.auth.logoutConfirm, [
                  { text: strings.common.cancel, style: 'cancel' },
                  {
                    text: strings.profile.logout,
                    onPress: () => void run(() => signOut()),
                  },
                ]);
              }}
              style={{ marginTop: spacing.sm }}
            />
            <Button
              label={strings.profile.deleteAccount}
              variant="ghost"
              onPress={() => {
                Alert.alert(strings.auth.deleteTitle, strings.auth.deleteBody, [
                  { text: strings.common.cancel, style: 'cancel' },
                  {
                    text: strings.auth.deleteConfirm,
                    style: 'destructive',
                    onPress: () =>
                      void run(async () => {
                        const res = await requestAccountDeletion();
                        Alert.alert(
                          strings.auth.deleteTitle,
                          res.remote
                            ? strings.auth.deleteQueued
                            : strings.auth.deleteQueued,
                        );
                      }),
                  },
                ]);
              }}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, backgroundColor: colors.cream },
  sub: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: 4,
  },
  cardTitle: { ...typography.bodyStrong, color: colors.ink },
  cardBody: { ...typography.body, color: colors.muted },
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
  hint: { ...typography.caption, color: colors.muted, marginTop: spacing.md },
});
