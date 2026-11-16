import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { getGuestKey } from '@/services/guestId';
import { migrateGuestDataToAccount } from '@/services/accountMigration';

export type AuthState = {
  session: Session | null;
  user: User | null;
  isGuest: boolean;
};

export async function getAuthState(): Promise<AuthState> {
  if (!isSupabaseConfigured || !supabase) {
    return { session: null, user: null, isGuest: true };
  }
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  return {
    session,
    user: session?.user ?? null,
    isGuest: !session?.user,
  };
}

export function subscribeAuth(callback: (state: AuthState) => void): () => void {
  if (!supabase) {
    callback({ session: null, user: null, isGuest: true });
    return () => undefined;
  }
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({
      session,
      user: session?.user ?? null,
      isGuest: !session?.user,
    });
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('supabase_not_configured');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  await afterSignIn(data.user);
  return data;
}

export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  if (!supabase) throw new Error('supabase_not_configured');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: displayName?.trim() || undefined } },
  });
  if (error) throw error;
  if (data.user) await afterSignIn(data.user);
  return data;
}

export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple() {
  if (!supabase) throw new Error('supabase_not_configured');
  if (Platform.OS !== 'ios') throw new Error('apple_ios_only');
  const available = await isAppleAuthAvailable();
  if (!available) throw new Error('apple_unavailable');

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) throw new Error('apple_no_token');

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;

  const displayName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  if (data.user) {
    await afterSignIn(data.user, displayName || undefined);
  }
  return data;
}

async function afterSignIn(user: User, displayName?: string) {
  await upsertProfile(user, displayName);
  await migrateGuestDataToAccount(user.id);
}

export async function upsertProfile(user: User, displayName?: string) {
  if (!supabase) return;
  const guestKey = await getGuestKey();
  const name =
    displayName ||
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split('@')[0] ||
    null;
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      display_name: name,
      email: user.email ?? null,
      guest_key: guestKey,
      preferred_locale: 'es-CL',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  // Schema may be missing — ignore PGRST205
  if (error && error.code !== 'PGRST205') {
    console.warn('[auth] upsertProfile', error.message);
  }
}

export async function updateDisplayName(displayName: string) {
  if (!supabase) throw new Error('supabase_not_configured');
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error('not_authenticated');
  const { error: metaErr } = await supabase.auth.updateUser({
    data: { display_name: displayName.trim() },
  });
  if (metaErr) throw metaErr;
  await upsertProfile(user, displayName.trim());
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Apple App Store guideline: in-app account deletion. Marks request + signs out. */
export async function requestAccountDeletion(): Promise<{ remote: boolean }> {
  if (!supabase) throw new Error('supabase_not_configured');
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) throw new Error('not_authenticated');

  const { error } = await supabase.rpc('request_account_deletion');
  const remote = !error;
  // Always sign out locally so the account is unusable on device.
  await supabase.auth.signOut();
  return { remote };
}

export type AccountExport = {
  exportedAt: string;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  guestKey: string;
  history: unknown;
  favorites: unknown;
  preferences: unknown;
  community: unknown;
};

export async function exportAccountData(): Promise<AccountExport> {
  const { getHistory } = await import('@/services/history');
  const { getFavorites } = await import('@/services/favorites');
  const { getDietaryPreferences } = await import('@/services/preferences');
  const { listMyCommunityActivity } = await import('@/services/communityStore');
  const guestKey = await getGuestKey();
  const auth = await getAuthState();
  return {
    exportedAt: new Date().toISOString(),
    userId: auth.user?.id ?? null,
    email: auth.user?.email ?? null,
    displayName: (auth.user?.user_metadata?.display_name as string | undefined) ?? null,
    guestKey,
    history: await getHistory(),
    favorites: await getFavorites(),
    preferences: await getDietaryPreferences(),
    community: await listMyCommunityActivity(),
  };
}
