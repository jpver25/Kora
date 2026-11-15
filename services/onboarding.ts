import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'kora.onboarding.completed.v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === '1';
}

export async function setOnboardingCompleted(done = true): Promise<void> {
  await AsyncStorage.setItem(KEY, done ? '1' : '0');
}
