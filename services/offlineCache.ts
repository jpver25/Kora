import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '@/types/product';
import type { EntitlementSnapshot } from '@/types/entitlements';

const PRODUCT_CACHE_KEY = 'kora.product.cache.v1';
const OFFLINE_PACKAGE_META_KEY = 'kora.offline.package.meta.v1';
const OFFLINE_PACKAGE_PRODUCTS_KEY = 'kora.offline.package.products.v1';

const MAX_CACHED_PRODUCTS = 80;

type ProductCache = Record<string, { product: Product; cachedAt: string }>;

export type OfflinePackageMeta = {
  version: string;
  downloadedAt: string | null;
  productCount: number;
  /** Design-only until Premium + package URL are wired. */
  status: 'not_downloaded' | 'ready' | 'stale' | 'requires_premium';
  note: string;
};

/**
 * Cache individual products for offline ficha viewing (Free + Premium).
 * History and favorites already persist in AsyncStorage.
 */
export async function cacheProduct(product: Product): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCT_CACHE_KEY);
    const map: ProductCache = raw ? (JSON.parse(raw) as ProductCache) : {};
    map[product.barcode] = { product, cachedAt: new Date().toISOString() };
    const keys = Object.keys(map);
    if (keys.length > MAX_CACHED_PRODUCTS) {
      const sorted = keys.sort(
        (a, b) => new Date(map[a].cachedAt).getTime() - new Date(map[b].cachedAt).getTime(),
      );
      for (const k of sorted.slice(0, keys.length - MAX_CACHED_PRODUCTS)) {
        delete map[k];
      }
    }
    await AsyncStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export async function getCachedProduct(barcode: string): Promise<Product | null> {
  try {
    const raw = await AsyncStorage.getItem(PRODUCT_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as ProductCache;
    return map[barcode]?.product ?? null;
  } catch {
    return null;
  }
}

export async function getOfflinePackageMeta(): Promise<OfflinePackageMeta> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_PACKAGE_META_KEY);
    if (raw) return JSON.parse(raw) as OfflinePackageMeta;
  } catch {
    // fall through
  }
  return {
    version: '0',
    downloadedAt: null,
    productCount: 0,
    status: 'not_downloaded',
    note: 'Paquete offline Premium aún no descargado.',
  };
}

/**
 * Premium offline catalog package — design + local storage hooks.
 * Does not invent a catalog: without a real package URL / Premium entitlement, returns requires_premium / empty.
 */
export async function downloadOfflineCatalogPackage(
  snap: EntitlementSnapshot,
  /** Optional remote package of Product[] — only used when provided by a real backend. */
  products?: Product[],
): Promise<OfflinePackageMeta> {
  if (!snap.isPremium) {
    const meta: OfflinePackageMeta = {
      version: '0',
      downloadedAt: null,
      productCount: 0,
      status: 'requires_premium',
      note: 'Kora Premium es necesario para descargar el catálogo offline.',
    };
    await AsyncStorage.setItem(OFFLINE_PACKAGE_META_KEY, JSON.stringify(meta));
    return meta;
  }

  if (!products || products.length === 0) {
    const meta: OfflinePackageMeta = {
      version: 'design-1',
      downloadedAt: null,
      productCount: 0,
      status: 'not_downloaded',
      note:
        'Diseño listo: el paquete se descargará desde el CDN/Supabase Storage cuando exista un snapshot publicado. No se inventan productos.',
    };
    await AsyncStorage.setItem(OFFLINE_PACKAGE_META_KEY, JSON.stringify(meta));
    return meta;
  }

  const meta: OfflinePackageMeta = {
    version: `pkg-${Date.now()}`,
    downloadedAt: new Date().toISOString(),
    productCount: products.length,
    status: 'ready',
    note: 'Catálogo offline listo en este dispositivo.',
  };
  await AsyncStorage.setItem(OFFLINE_PACKAGE_PRODUCTS_KEY, JSON.stringify(products));
  await AsyncStorage.setItem(OFFLINE_PACKAGE_META_KEY, JSON.stringify(meta));
  for (const p of products) {
    await cacheProduct(p);
  }
  return meta;
}

export async function getOfflinePackageProducts(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_PACKAGE_PRODUCTS_KEY);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

export async function clearOfflinePackage(): Promise<void> {
  await AsyncStorage.multiRemove([OFFLINE_PACKAGE_META_KEY, OFFLINE_PACKAGE_PRODUCTS_KEY]);
}
