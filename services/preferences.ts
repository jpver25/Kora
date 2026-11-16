import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Product } from '@/types/product';

const KEY = 'kora.dietary.preferences.v1';

export type DietaryPreferenceId =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'lactose_free'
  | 'no_palm_oil'
  | 'low_sugar'
  | 'prefer_organic';

export type DietaryPreferences = Record<DietaryPreferenceId, boolean>;

export const DEFAULT_PREFERENCES: DietaryPreferences = {
  vegetarian: false,
  vegan: false,
  gluten_free: false,
  lactose_free: false,
  no_palm_oil: false,
  low_sugar: false,
  prefer_organic: false,
};

export async function getDietaryPreferences(): Promise<DietaryPreferences> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as DietaryPreferences) };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function setDietaryPreferences(prefs: DietaryPreferences): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}

export type CompatibilityWarning = {
  id: DietaryPreferenceId;
  severity: 'warn' | 'info';
  message: string;
};

function haystack(product: Product): string {
  return [
    product.ingredientsText ?? '',
    ...(product.labels ?? []),
    ...(product.categoriesTags ?? []),
  ]
    .join(' ')
    .toLowerCase();
}

/** Real label/ingredient heuristics — never invents product data. */
export function evaluateCompatibility(
  product: Product,
  prefs: DietaryPreferences,
): CompatibilityWarning[] {
  const text = haystack(product);
  const warnings: CompatibilityWarning[] = [];

  if (prefs.vegan) {
    const animal =
      /\b(milk|leche|lactose|lactosa|egg|huevo|honey|miel|whey|casein|gelatin|gelatina|carne|meat|fish|pescado)\b/.test(
        text,
      );
    if (animal && !/\bvegan\b|\bvegano\b/.test(text)) {
      warnings.push({
        id: 'vegan',
        severity: 'warn',
        message: 'Puede no ser vegano según ingredientes/etiquetas disponibles.',
      });
    }
  }

  if (prefs.vegetarian) {
    if (/\b(carne|meat|fish|pescado|gelatin|gelatina|jamón|pollo)\b/.test(text)) {
      warnings.push({
        id: 'vegetarian',
        severity: 'warn',
        message: 'Se detectaron indicios de ingredientes no vegetarianos.',
      });
    }
  }

  if (prefs.gluten_free) {
    if (/\b(gluten|trigo|wheat|cebada|barley|centeno|rye|avena)\b/.test(text) && !/\bgluten.?free\b|\bsin gluten\b/.test(text)) {
      warnings.push({
        id: 'gluten_free',
        severity: 'warn',
        message: 'Posible presencia de gluten según la ficha.',
      });
    }
  }

  if (prefs.lactose_free) {
    if (/\b(milk|leche|lactose|lactosa|whey|cream|crema|yogurt|yogur|queso|cheese)\b/.test(text) && !/\blactose.?free\b|\bsin lactosa\b/.test(text)) {
      warnings.push({
        id: 'lactose_free',
        severity: 'warn',
        message: 'Puede contener lácteos o lactosa.',
      });
    }
  }

  if (prefs.no_palm_oil) {
    if (/\bpalm\b|\baceite de palma\b|\bhuile de palme\b/.test(text)) {
      warnings.push({
        id: 'no_palm_oil',
        severity: 'warn',
        message: 'Contiene o menciona aceite de palma.',
      });
    }
  }

  if (prefs.low_sugar) {
    const sugars = product.nutriments.sugars100g;
    if (sugars != null && sugars >= 12.5) {
      warnings.push({
        id: 'low_sugar',
        severity: 'warn',
        message: `Azúcares altos: ${sugars} g / 100g (preferencia bajo azúcar).`,
      });
    }
  }

  if (prefs.prefer_organic) {
    const organic = (product.labels ?? []).some((l) =>
      /\borganic\b|\bbio\b|\borgánico\b|\borganico\b/.test(l.toLowerCase()),
    );
    if (!organic) {
      warnings.push({
        id: 'prefer_organic',
        severity: 'info',
        message: 'No tiene etiqueta orgánica/bio en la ficha.',
      });
    }
  }

  return warnings;
}
