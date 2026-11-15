import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { lookupProductByBarcode } from '@/services/productLookup';
import { cosineSimilarity } from '@/services/vision/imageEmbedding';
import type { ImageEmbedding, OcrResult, VisualCandidate } from '@/types/vision';
import { buildSearchQueriesFromOcr } from '@/services/vision/ocr';

type OffSearchHit = {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
};

async function searchOpenFacts(
  query: string,
  kind: 'food' | 'beauty',
): Promise<VisualCandidate[]> {
  const base =
    kind === 'food'
      ? 'https://world.openfoodfacts.org'
      : 'https://world.openbeautyfacts.org';
  const url =
    `${base}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=8`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KoraApp/1.0 (Chile; visual-search)',
    },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { products?: OffSearchHit[] };
  const products = data.products ?? [];
  return products
    .filter((p) => p.code && (p.product_name || p.product_name_es))
    .map((p, index) => {
      const name = p.product_name_es || p.product_name || 'Producto';
      // Rank by OFF order with mild decay — never invent barcodes.
      const score = Math.max(0.35, 0.78 - index * 0.06);
      return {
        barcode: String(p.code),
        name,
        brand: p.brands ?? null,
        imageUrl: p.image_front_url || p.image_url || null,
        score,
        sources: [kind === 'food' ? 'ocr_off_search' : 'ocr_obf_search'] as VisualCandidate['sources'],
      };
    });
}

/** Text search from OCR tokens against Open Food/Beauty Facts (real catalog only). */
export async function searchByOcr(ocr: OcrResult): Promise<VisualCandidate[]> {
  const queries = buildSearchQueriesFromOcr(ocr);
  if (!queries.length) return [];
  const batches = await Promise.all(
    queries.flatMap((query) => [
      searchOpenFacts(query, 'food'),
      searchOpenFacts(query, 'beauty'),
    ]),
  );
  return batches.flat();
}

type RefRow = {
  barcode: string;
  ocr_text: string | null;
  embedding: number[] | string | null;
  image_url: string | null;
  products?: { name?: string; brand?: string | null; image_url?: string | null } | null;
};

function parseEmbedding(value: RefRow['embedding']): number[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as number[];
      return Array.isArray(parsed) ? parsed.map(Number) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * pgvector similarity via RPC `match_product_reference_images`.
 * Falls back to client-side cosine against a limited fetch if RPC missing.
 */
export async function searchByEmbedding(
  embedding: ImageEmbedding,
  limit = 8,
): Promise<VisualCandidate[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase.rpc('match_product_reference_images', {
      query_embedding: embedding.vector,
      match_count: limit,
      match_threshold: 0.35,
    });
    if (!error && Array.isArray(data)) {
      return (data as Array<{
        barcode: string;
        name: string;
        brand: string | null;
        image_url: string | null;
        similarity: number;
      }>)
        .filter((row) => row.barcode && row.similarity >= 0.35)
        .map((row) => ({
          barcode: row.barcode,
          name: row.name,
          brand: row.brand,
          imageUrl: row.image_url,
          score: Math.min(0.98, Number(row.similarity)),
          sources: ['pgvector'] as VisualCandidate['sources'],
        }));
    }
  } catch {
    // RPC may not be deployed yet — try limited table scan.
  }

  try {
    const { data, error } = await supabase
      .from('product_reference_images')
      .select('barcode, ocr_text, embedding, image_url, products(name, brand, image_url)')
      .not('embedding', 'is', null)
      .limit(40);
    if (error || !data) return [];
    const scored: VisualCandidate[] = [];
    for (const row of data as RefRow[]) {
      const vec = parseEmbedding(row.embedding);
      if (!vec) continue;
      const sim = cosineSimilarity(embedding.vector, vec);
      if (sim < 0.35) continue;
      scored.push({
        barcode: row.barcode,
        name: row.products?.name || row.barcode,
        brand: row.products?.brand ?? null,
        imageUrl: row.image_url || row.products?.image_url || null,
        score: Math.min(0.95, sim),
        sources: ['pgvector'],
      });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch {
    return [];
  }
}

/** Merge candidates by barcode; keep real catalog entries only. */
export function mergeCandidates(groups: VisualCandidate[][]): VisualCandidate[] {
  const map = new Map<string, VisualCandidate>();
  for (const group of groups) {
    for (const c of group) {
      if (!c.barcode) continue;
      const prev = map.get(c.barcode);
      if (!prev) {
        map.set(c.barcode, { ...c, sources: [...c.sources] });
        continue;
      }
      const score = Math.min(0.99, Math.max(prev.score, c.score) + 0.04);
      const sources = Array.from(new Set([...prev.sources, ...c.sources]));
      map.set(c.barcode, {
        ...prev,
        name: prev.name || c.name,
        brand: prev.brand || c.brand,
        imageUrl: prev.imageUrl || c.imageUrl,
        score,
        sources,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.score - a.score);
}

/** Hydrate top candidates with full Product records (OFF/Kora) — never fabricate. */
export async function hydrateCandidates(
  candidates: VisualCandidate[],
  limit = 5,
): Promise<VisualCandidate[]> {
  const top = candidates.slice(0, limit);
  const hydrated: VisualCandidate[] = [];
  for (const c of top) {
    try {
      const product = await lookupProductByBarcode(c.barcode);
      if (!product) {
        // Keep candidate metadata from search hit only if barcode came from OFF.
        hydrated.push(c);
        continue;
      }
      hydrated.push({
        ...c,
        name: product.name,
        brand: product.brand,
        imageUrl: product.imageUrl,
        product,
      });
    } catch {
      hydrated.push(c);
    }
  }
  return hydrated;
}
