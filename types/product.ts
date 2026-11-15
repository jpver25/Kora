import type { ScoreBand } from '@/theme/colors';

export type ProductCategory = 'food' | 'beauty' | 'unknown';

export type ScanMode = 'auto' | 'barcode' | 'visual';

export type IdentificationMethod = 'barcode' | 'visual' | 'manual';

export interface ProductNutriments {
  energyKcal100g?: number | null;
  fat100g?: number | null;
  saturatedFat100g?: number | null;
  sugars100g?: number | null;
  salt100g?: number | null;
  proteins100g?: number | null;
  fiber100g?: number | null;
}

export interface ProductAdditive {
  code: string;
  name?: string;
}

export interface KoraScoreBreakdown {
  nutrition: number | null;
  additives: number | null;
  processing: number | null;
  organicBonus: number | null;
}

export interface KoraScore {
  value: number | null;
  band: ScoreBand;
  breakdown: KoraScoreBreakdown;
  explanation: string[];
}

export interface Product {
  barcode: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  category: ProductCategory;
  ingredientsText?: string | null;
  additives: ProductAdditive[];
  nutriscoreGrade?: string | null;
  novaGroup?: number | null;
  labels?: string[];
  categoriesTags?: string[];
  nutriments: ProductNutriments;
  score: KoraScore;
  source: 'openfoodfacts' | 'openbeautyfacts' | 'kora' | 'unknown';
  raw?: unknown;
}

export interface HistoryEntry {
  id: string;
  barcode: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  scoreValue: number | null;
  scoreBand: ScoreBand;
  scannedAt: string;
  method: IdentificationMethod;
}

/** Hook point for Phase 3 visual recognition */
export interface VisualRecognitionRequest {
  imageUri: string;
  hint?: string;
}

export interface VisualRecognitionResult {
  status: 'not_implemented' | 'ok' | 'error';
  candidates?: Array<{ name: string; confidence: number; barcode?: string }>;
  message: string;
}
