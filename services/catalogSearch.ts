import { toProduct, type OffProduct } from '@/services/openFoodFacts';
import type { Product, ProductCategory } from '@/types/product';

export type CatalogKind = 'food' | 'beauty' | 'all';

export type SearchFilters = {
  query: string;
  kind: CatalogKind;
  /** Inclusive 0–100; null means no bound */
  minScore: number | null;
  maxScore: number | null;
  /** When true, treat query as barcode digits */
  barcodeMode?: boolean;
};

async function searchOff(
  query: string,
  kind: 'food' | 'beauty',
  pageSize = 24,
): Promise<Product[]> {
  const base =
    kind === 'food'
      ? 'https://world.openfoodfacts.org'
      : 'https://world.openbeautyfacts.org';
  const url =
    `${base}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=${pageSize}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KoraApp/1.0 (Chile; catalog-search)',
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: OffProduct[] };
  const source = kind === 'food' ? 'openfoodfacts' : 'openbeautyfacts';
  return (data.products ?? [])
    .filter((p) => p.code)
    .map((p) => toProduct(String(p.code), p, source));
}

async function searchOffByCategory(
  categoryTag: string,
  kind: 'food' | 'beauty',
  pageSize = 20,
): Promise<Product[]> {
  const base =
    kind === 'food'
      ? 'https://world.openfoodfacts.org'
      : 'https://world.openbeautyfacts.org';
  const tag = categoryTag.replace(/^en:/, '');
  const url =
    `${base}/cgi/search.pl?action=process&tagtype_0=categories&tag_contains_0=contains` +
    `&tag_0=${encodeURIComponent(tag)}&json=1&page_size=${pageSize}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KoraApp/1.0 (Chile; category-search)',
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: OffProduct[] };
  const source = kind === 'food' ? 'openfoodfacts' : 'openbeautyfacts';
  return (data.products ?? [])
    .filter((p) => p.code)
    .map((p) => toProduct(String(p.code), p, source));
}

function matchesFilters(product: Product, filters: SearchFilters): boolean {
  if (filters.kind === 'food' && product.category === 'beauty') return false;
  if (filters.kind === 'beauty' && product.category !== 'beauty') return false;
  const score = product.score.value;
  if (filters.minScore != null && (score == null || score < filters.minScore)) return false;
  if (filters.maxScore != null && (score == null || score > filters.maxScore)) return false;

  const q = filters.query.trim().toLowerCase();
  if (!q) return true;
  if (filters.barcodeMode || /^\d{6,}$/.test(q)) {
    return product.barcode.includes(q.replace(/\D/g, ''));
  }
  const hay = `${product.name} ${product.brand ?? ''} ${product.categoriesTags?.join(' ') ?? ''}`.toLowerCase();
  return q.split(/\s+/).every((token) => hay.includes(token) || product.barcode.includes(token));
}

/** Search real OFF/OBF catalogs — never invents products. */
export async function searchCatalog(filters: SearchFilters): Promise<Product[]> {
  const q = filters.query.trim();
  if (!q) return [];

  if (filters.barcodeMode || /^\d{8,14}$/.test(q)) {
    const { lookupProductByBarcode } = await import('@/services/productLookup');
    const one = await lookupProductByBarcode(q);
    return one && matchesFilters(one, filters) ? [one] : [];
  }

  const kinds: Array<'food' | 'beauty'> =
    filters.kind === 'all' ? ['food', 'beauty'] : [filters.kind];
  const batches = await Promise.all(kinds.map((k) => searchOff(q, k)));
  const map = new Map<string, Product>();
  for (const p of batches.flat()) {
    if (matchesFilters(p, filters)) map.set(p.barcode, p);
  }
  return Array.from(map.values()).sort(
    (a, b) => (b.score.value ?? -1) - (a.score.value ?? -1),
  );
}

export type ExploreCategory = {
  id: string;
  title: string;
  hint: string;
  tag: string;
  kind: ProductCategory;
};

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { id: 'bebidas', title: 'Bebidas', hint: 'Jugos, aguas, soft drinks', tag: 'beverages', kind: 'food' },
  { id: 'snacks', title: 'Snacks', hint: 'Galletas y snacks', tag: 'snacks', kind: 'food' },
  { id: 'lacteos', title: 'Lácteos', hint: 'Yogures y leches', tag: 'dairies', kind: 'food' },
  { id: 'cereales', title: 'Cereales', hint: 'Desayuno y granos', tag: 'breakfast-cereals', kind: 'food' },
  {
    id: 'cuidado',
    title: 'Cuidado personal',
    hint: 'Higiene y cosméticos',
    tag: 'cosmetic',
    kind: 'beauty',
  },
];

export async function fetchCategoryRanking(category: ExploreCategory): Promise<Product[]> {
  const kind = category.kind === 'beauty' ? 'beauty' : 'food';
  const products = await searchOffByCategory(category.tag, kind);
  return products
    .filter((p) => p.score.value != null)
    .sort((a, b) => (b.score.value ?? -1) - (a.score.value ?? -1));
}

/**
 * Healthier alternatives from the same OFF category tags with better Kora score.
 * Uses only real catalog hits — no invented barcodes.
 */
export async function findHealthierAlternatives(
  product: Product,
  limit = 5,
): Promise<Product[]> {
  const tags = (product.categoriesTags ?? [])
    .map((t) => t.replace(/^en:/, ''))
    .filter((t) => t.length > 2 && !t.includes('unknown'));
  const tag = tags[0] ?? (product.category === 'beauty' ? 'cosmetic' : 'snacks');
  const kind = product.category === 'beauty' ? 'beauty' : 'food';
  const candidates = await searchOffByCategory(tag, kind, 30);
  const baseScore = product.score.value ?? 0;
  return candidates
    .filter((p) => p.barcode !== product.barcode)
    .filter((p) => (p.score.value ?? -1) > baseScore)
    .sort((a, b) => (b.score.value ?? -1) - (a.score.value ?? -1))
    .slice(0, limit);
}
