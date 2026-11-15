import type { Product, ProductAdditive } from '@/types/product';
import { computeKoraScore } from '@/services/scoring';
import { mapNutriments } from '@/services/nutriments';

const OFF_FOOD = 'https://world.openfoodfacts.org/api/v2/product';
const OFF_BEAUTY = 'https://world.openbeautyfacts.org/api/v2/product';

export type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  brands?: string;
  image_front_url?: string;
  image_url?: string;
  ingredients_text?: string;
  ingredients_text_es?: string;
  additives_tags?: string[];
  nutriscore_grade?: string;
  nova_group?: number;
  labels_tags?: string[];
  categories_tags?: string[];
  nutriments?: Record<string, number | undefined>;
};

function mapAdditives(tags: string[] = []): ProductAdditive[] {
  return tags.map((tag) => {
    const code = tag.replace(/^en:/, '').toUpperCase();
    return { code, name: code };
  });
}

export function toProduct(barcode: string, raw: OffProduct, source: Product['source']): Product {
  const additives = mapAdditives(raw.additives_tags);
  const nutriments = mapNutriments(raw.nutriments);
  const labels = (raw.labels_tags ?? []).map((t) => t.replace(/^en:/, ''));
  const score = computeKoraScore({
    nutriscoreGrade: raw.nutriscore_grade,
    novaGroup: raw.nova_group,
    additives,
    nutriments,
    labels,
  });

  const categoryTags = raw.categories_tags ?? [];
  const isBeauty =
    source === 'openbeautyfacts' ||
    categoryTags.some((t) => t.includes('cosmetic') || t.includes('hygiene'));

  return {
    barcode: raw.code ?? barcode,
    name: raw.product_name_es || raw.product_name || 'Producto sin nombre',
    brand: raw.brands || null,
    imageUrl: raw.image_front_url || raw.image_url || null,
    category: isBeauty ? 'beauty' : 'food',
    ingredientsText: raw.ingredients_text_es || raw.ingredients_text || null,
    additives,
    nutriscoreGrade: raw.nutriscore_grade ?? null,
    novaGroup: raw.nova_group ?? null,
    labels,
    categoriesTags: categoryTags,
    nutriments,
    score,
    source,
    raw,
  };
}

async function fetchOff(
  base: string,
  barcode: string,
  source: Product['source'],
): Promise<Product | null> {
  const url = `${base}/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'KoraApp/1.0 (Chile; Expo; educational)',
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: number; product?: OffProduct };
  if (data.status !== 1 || !data.product) return null;
  return toProduct(barcode, data.product, source);
}

/** Look up barcode in Open Food Facts, then Open Beauty Facts. */
export async function lookupOpenFacts(barcode: string): Promise<Product | null> {
  const cleaned = barcode.replace(/\D/g, '');
  if (!cleaned) return null;

  const food = await fetchOff(OFF_FOOD, cleaned, 'openfoodfacts');
  if (food) return food;

  const beauty = await fetchOff(OFF_BEAUTY, cleaned, 'openbeautyfacts');
  return beauty;
}
