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

let recognitionGeneration = 0;

/** Cancel in-flight visual recognition results (stale UI updates). */
export function cancelStaleVisualRecognition(): number {
  recognitionGeneration += 1;
  return recognitionGeneration;
}

/**
 * Full Phase 3 visual pipeline:
 * ProductDetection → OCR → ImageEmbedding → VisualProductSearch → ranking → confidence tier.
 * Never invents product records: candidates only from OFF/OBF/Supabase matches.
 */
export async function identifyPackagingFromImage(
  request: VisualRecognitionRequest,
): Promise<VisualSearchResult> {
  const started = Date.now();
  const generation = ++recognitionGeneration;
  const provider = getActiveVisionProvider();

  if (!request.imageUri) {
    return emptyResult(provider, strings.scan.visual.missingImage, started);
  }

  const { frame, base64, mimeType } = await frameToBase64Jpeg(request.imageUri);
  if (generation !== recognitionGeneration) {
    return cancelledResult(provider, started);
  }

  let ocr;
  let embedding;
  try {
    [ocr, embedding] = await Promise.all([
      extractPackagingText({ base64, mimeType }),
      embedPackagingImage({ base64, mimeType }),
    ]);
  } catch (err) {
    // Edge misconfigured / network — fall back to needsProvider rather than crashing UI.
    const message =
      err instanceof Error ? err.message : strings.scan.visual.needsProvider;
    return emptyResult(provider === 'edge' ? 'none' : provider, message, started);
  }

  if (generation !== recognitionGeneration) {
    return cancelledResult(provider, started);
  }

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

  if (generation !== recognitionGeneration) {
    return cancelledResult(provider, started);
  }

  const merged = mergeCandidates([ocrHits, vectorHits]);
  const ranked = rankVisualCandidates(merged, ocr);
  const hydrated = await hydrateCandidates(ranked);

  if (generation !== recognitionGeneration) {
    return cancelledResult(provider, started);
  }

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

function cancelledResult(
  provider: VisualSearchResult['provider'],
  started: number,
): VisualSearchResult {
  return {
    tier: 'no_match',
    candidates: [],
    ocr: null,
    embedding: null,
    frame: null,
    provider,
    message: strings.common.cancel,
    diagnostics: {
      ocrTokenCount: 0,
      embeddingDims: 0,
      pgvectorHits: 0,
      offSearchHits: 0,
      elapsedMs: Date.now() - started,
      cancelled: true,
    },
  };
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
      embeddingDims: 0,
      pgvectorHits: 0,
      offSearchHits: 0,
      elapsedMs: Date.now() - started,
    },
  };
}

function messageForTier(
  tier: VisualSearchResult['tier'],
  count: number,
  provider: VisualSearchResult['provider'],
): string {
  if (provider === 'none' && tier === 'no_match') return strings.scan.visual.needsProvider;
  switch (tier) {
    case 'auto_open':
      return strings.scan.visual.autoOpen;
    case 'candidates':
      return strings.scan.visual.candidates.replace('{n}', String(count));
    case 'low_confidence':
      return strings.scan.visual.lowConfidence;
    default:
      return strings.scan.visual.noMatch;
  }
}

// Keep VisualRecognitionResult type used by older imports.
export type { VisualRecognitionResult };
