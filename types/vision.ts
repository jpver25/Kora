import type { Product } from '@/types/product';

export type ConfidenceTier = 'auto_open' | 'candidates' | 'low_confidence' | 'no_match';

export type VisionProviderId = 'openai' | 'edge' | 'none';

export interface PackagingFrame {
  uri: string;
  width: number;
  height: number;
  /** Normalized crop used as packaging ROI (0–1). */
  crop: { originX: number; originY: number; width: number; height: number };
  detectionMethod: 'center_roi' | 'manual' | 'ml_kit';
  confidence: number;
}

export interface OcrToken {
  text: string;
  language?: 'es' | 'en' | 'unknown';
  confidence?: number;
}

export interface OcrResult {
  provider: VisionProviderId | 'fixture' | 'heuristic';
  fullText: string;
  tokens: OcrToken[];
  brandCandidates: string[];
  productNameCandidates: string[];
  languages: Array<'es' | 'en'>;
}

export interface ImageEmbedding {
  provider: VisionProviderId | 'interim_ahash' | 'fixture';
  model: string;
  dims: number;
  vector: number[];
  /** True when vector is a documented interim fingerprint, not CLIP/AI. */
  interim: boolean;
}

export interface VisualCandidate {
  barcode: string;
  name: string;
  brand?: string | null;
  imageUrl?: string | null;
  score: number;
  sources: Array<'pgvector' | 'ocr_off_search' | 'ocr_obf_search' | 'multimodal'>;
  product?: Product;
}

export interface VisualSearchResult {
  tier: ConfidenceTier;
  candidates: VisualCandidate[];
  ocr: OcrResult | null;
  embedding: ImageEmbedding | null;
  frame: PackagingFrame | null;
  provider: VisionProviderId;
  message: string;
  /** Measured diagnostics for debugging / docs — never invent products. */
  diagnostics: {
    ocrTokenCount: number;
    embeddingDims: number | null;
    pgvectorHits: number;
    offSearchHits: number;
    elapsedMs: number;
    cancelled?: boolean;
  };
}
