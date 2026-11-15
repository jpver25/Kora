import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry, Product } from '@/types/product';

const KEY = 'kora.favorites.v1';

export type FavoriteEntry = {
  barcode: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  scoreValue: number | null;
  scoreBand: HistoryEntry['scoreBand'];
  savedAt: string;
};

export async function getFavorites(): Promise<FavoriteEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FavoriteEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function isFavorite(barcode: string): Promise<boolean> {
  const list = await getFavorites();
  return list.some((f) => f.barcode === barcode);
}

export async function toggleFavorite(product: Product): Promise<boolean> {
  const list = await getFavorites();
  const exists = list.some((f) => f.barcode === product.barcode);
  let next: FavoriteEntry[];
  if (exists) {
    next = list.filter((f) => f.barcode !== product.barcode);
  } else {
    next = [
      {
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        scoreValue: product.score.value,
        scoreBand: product.score.band,
        savedAt: new Date().toISOString(),
      },
      ...list,
    ].slice(0, 100);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return !exists;
}
