import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGuestKey } from '@/services/guestId';
import { isSupabaseConfigured, supabase } from '@/services/supabase';

const MIGRATED_KEY = 'kora.guest.migrated.to.v1';

/**
 * Attach guest_key to the signed-in profile and mark local data as owned by the account.
 * Local AsyncStorage (history, favorites, preferences, community queue) stays on-device;
 * we stamp ownership so future sync can push under the user id.
 */
export async function migrateGuestDataToAccount(userId: string): Promise<{ migrated: boolean }> {
  const already = await AsyncStorage.getItem(MIGRATED_KEY);
  if (already === userId) return { migrated: false };

  const guestKey = await getGuestKey();
  await AsyncStorage.setItem(
    `kora.account.ownership.${userId}`,
    JSON.stringify({
      guestKey,
      migratedAt: new Date().toISOString(),
      keys: [
        'kora.scan.history.v1',
        'kora.favorites.v1',
        'kora.dietary.preferences.v1',
        'kora.community.local.v1',
        'kora.product.cache.v1',
      ],
    }),
  );

  if (isSupabaseConfigured && supabase) {
    await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          guest_key: guestKey,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .then(({ error }) => {
        if (error && error.code !== 'PGRST205') {
          console.warn('[migration]', error.message);
        }
      });
  }

  await AsyncStorage.setItem(MIGRATED_KEY, userId);
  return { migrated: true };
}
