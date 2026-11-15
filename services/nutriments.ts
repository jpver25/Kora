import type { ProductNutriments } from '@/types/product';

/** Map OFF-style or camelCase nutriment blobs into Kora ProductNutriments. */
export function mapNutriments(raw: Record<string, unknown> = {}): ProductNutriments {
  const num = (...keys: string[]): number | null => {
    for (const key of keys) {
      const v = raw[key];
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
      if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
  };

  return {
    energyKcal100g: num('energyKcal100g', 'energy-kcal_100g', 'energy_kcal_100g'),
    fat100g: num('fat100g', 'fat_100g'),
    saturatedFat100g: num('saturatedFat100g', 'saturated-fat_100g', 'saturated_fat_100g'),
    sugars100g: num('sugars100g', 'sugars_100g'),
    salt100g: num('salt100g', 'salt_100g'),
    proteins100g: num('proteins100g', 'proteins_100g'),
    fiber100g: num('fiber100g', 'fiber_100g'),
  };
}
