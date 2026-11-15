import { lookupOpenFacts } from '@/services/openFoodFacts';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import type { Product } from '@/types/product';
import { computeKoraScore } from '@/services/scoring';

async function lookupKoraCatalog(barcode: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();
    if (error || !data) return null;

    const additives = Array.isArray(data.additives) ? data.additives : [];
    const nutriments = data.nutriments ?? {};
    const score = computeKoraScore({
      nutriscoreGrade: data.nutriscore_grade,
      novaGroup: data.nova_group,
      additives,
      nutriments,
      labels: data.labels ?? [],
    });

    return {
      barcode: data.barcode,
      name: data.name,
      brand: data.brand,
      imageUrl: data.image_url,
      category: data.category ?? 'unknown',
      ingredientsText: data.ingredients_text,
      additives,
      nutriscoreGrade: data.nutriscore_grade,
      novaGroup: data.nova_group,
      labels: data.labels ?? [],
      categoriesTags: data.categories_tags ?? [],
      nutriments,
      score,
      source: 'kora',
      raw: data,
    };
  } catch {
    return null;
  }
}

/** Prefer Kora catalog when Supabase is live; fall back to Open Food/Beauty Facts. */
export async function lookupProductByBarcode(barcode: string): Promise<Product | null> {
  const cleaned = barcode.replace(/\D/g, '');
  if (cleaned.length < 6) return null;

  const fromKora = await lookupKoraCatalog(cleaned);
  if (fromKora) return fromKora;

  return lookupOpenFacts(cleaned);
}
