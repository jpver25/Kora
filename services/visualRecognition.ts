import type { VisualRecognitionRequest, VisualRecognitionResult } from '@/types/product';
import type { VisualSearchResult } from '@/types/vision';
import { frameToBase64Jpeg } from '@/services/vision/productDetection';
import { extractPackagingText, getActiveVisionProvider } from '@/services/vision/ocr';
import { embedPackagingImage } from '@/services/vision/imageEmbedding';
import {
  hydrateCandidates,
  mergeCandidates,
  searchByEmbedding,
  searchByOcr,
} from '@/services/vision/visualProductSearch';
import { assignConfidenceTier, rankVisualCandidates } from '@/services/vision/ranking';
import { strings } from '@/constants/strings.es';

export type { VisualSearchResult };

/**
 * Full Phase 3 visual pipeline:
 * ProductDetection → OCR → ImageEmbedding → VisualProductSearch → ranking → confidence tier.
 * Never invents product records: candidates only from OFF/OBF/Supabase matches.
 */
export async function identifyPackagingFromImage(
  request: VisualRecognitionRequest,
): Promise<VisualSearchResult> {
  const started = Date.now();
  const provider = getActiveVisionProvider();

  if (!request.imageUri) {
    return emptyResult(provider, strings.scan.visual.missingImage, started);
  }

  const { frame, base64, mimeType } = await frameToBase64Jpeg(request.imageUri);

  const [ocr, embedding] = await Promise.all([
    extractPackagingText({ base64, mimeType }),
    embedPackagingImage({ base64, mimeType }),
  ]);

  if (provider === 'none' && !ocr.fullText) {
    return {
      tier: 'no_match',
      candidates: [],
      ocr,
      embedding,
      frame,
      provider,
      message: strings.scan.visual.needsProvider,
      diagnostics: {
        ocrTokenCount: 0,
        embeddingDims: embedding.dims,
        pgvectorHits: 0,
        offSearchHits: 0,
        elapsedMs: Date.now() - started,
      },
    };
  }

  const [ocrHits, vectorHits] = await Promise.all([
    searchByOcr(ocr),
    searchByEmbedding(embedding),
  ]);

  const merged = mergeCandidates([ocrHits, vectorHits]);
  const ranked = rankVisualCandidates(merged, ocr);
  const hydrated = await hydrateCandidates(ranked);
  const { tier, candidates } = assignConfidenceTier(hydrated);

  return {
    tier,
    candidates,
    ocr,
    embedding,
    frame,
    provider,
    message: messageForTier(tier, candidates.length, provider),
    diagnostics: {
      ocrTokenCount: ocr.tokens.length,
      embeddingDims: embedding.dims,
      pgvectorHits: vectorHits.length,
      offSearchHits: ocrHits.length,
      elapsedMs: Date.now() - started,
    },
  };
}

/** Backward-compatible wrapper used by older call sites. */
export async function recognizeProductVisually(
  request: VisualRecognitionRequest,
): Promise<VisualRecognitionResult> {
  try {
    const result = await identifyPackagingFromImage(request);
    if (result.tier === 'no_match' && result.provider === 'none') {
      return {
        status: 'error',
        message: result.message,
        candidates: [],
      };
    }
    return {
      status: 'ok',
      message: result.message,
      candidates: result.candidates.map((c) => ({
        name: c.name,
        confidence: c.score,
        barcode: c.barcode,
      })),
    };
  } catch (err) {
    return {
      status: 'error',
      message: err instanceof Error ? err.message : strings.common.error,
    };
  }
}

function messageForTier(
  tier: VisualSearchResult['tier'],
  count: number,
  provider: VisualSearchResult['provider'],
): string {
  switch (tier) {
    case 'auto_open':
      return strings.scan.visual.autoOpen;
    case 'candidates':
      return strings.scan.visual.candidates.replace('{n}', String(count));
    case 'low_confidence':
      return strings.scan.visual.lowConfidence;
    default:
      return provider === 'none'
        ? strings.scan.visual.needsProvider
        : strings.scan.visual.noMatch;
  }
}

function emptyResult(
  provider: VisualSearchResult['provider'],
  message: string,
  started: number,
): VisualSearchResult {
  return {
    tier: 'no_match',
    candidates: [],
    ocr: null,
    embedding: null,
    frame: null,
    provider,
    message,
    diagnostics: {
      ocrTokenCount: 0,
      embeddingDims: null,
      pgvectorHits: 0,
      offSearchHits: 0,
      elapsedMs: Date.now() - started,
    },
  };
}
