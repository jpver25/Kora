import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry, IdentificationMethod, Product } from '@/types/product';

const KEY = 'kora.scan.history.v1';
const MAX = 50;

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addHistoryFromProduct(
  product: Product,
  method: IdentificationMethod = 'barcode',
): Promise<HistoryEntry[]> {
  const entry: HistoryEntry = {
    id: `${product.barcode}-${Date.now()}`,
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    scoreValue: product.score.value,
    scoreBand: product.score.band,
    scannedAt: new Date().toISOString(),
    method,
  };
  const prev = await getHistory();
  const next = [entry, ...prev.filter((e) => e.barcode !== product.barcode)].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
