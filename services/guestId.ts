import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'kora.guest.key.v1';

export async function getGuestKey(): Promise<string> {
  const existing = await AsyncStorage.getItem(KEY);
  if (existing) return existing;
  const next = `guest_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(KEY, next);
  return next;
}
