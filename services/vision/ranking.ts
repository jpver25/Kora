import type { OcrResult, VisualCandidate } from '@/types/vision';
import { assignConfidenceTier } from '@/services/vision/confidence';

function textOverlapBonus(candidate: VisualCandidate, ocr: OcrResult | null): number {
  if (!ocr) return 0;
  const hay = `${candidate.name} ${candidate.brand ?? ''}`.toLowerCase();
  let hits = 0;
  let checked = 0;
  const terms = [
    ...ocr.brandCandidates,
    ...ocr.productNameCandidates,
    ...ocr.tokens.map((t) => t.text),
  ];
  for (const term of terms.slice(0, 12)) {
    const t = term.toLowerCase();
    if (t.length < 3) continue;
    checked += 1;
    if (hay.includes(t)) hits += 1;
  }
  if (!checked) return 0;
  // Cap overlap so a common brand token alone cannot force auto_open.
  return Math.min(0.1, (hits / checked) * 0.12);
}

/**
 * Multimodal ranking: blend vector / OCR search scores with text overlap.
 * Does not invent products — only reorders real candidates.
 */
export function rankVisualCandidates(
  candidates: VisualCandidate[],
  ocr: OcrResult | null,
): VisualCandidate[] {
  return candidates
    .map((c) => {
      const bonus = textOverlapBonus(c, ocr);
      const multimodalBoost = c.sources.includes('pgvector') && c.sources.some((s) => s.startsWith('ocr_'))
        ? 0.06
        : 0;
      return {
        ...c,
        score: Math.min(0.99, c.score + bonus + multimodalBoost),
        sources: multimodalBoost
          ? (Array.from(new Set([...c.sources, 'multimodal'])) as VisualCandidate['sources'])
          : c.sources,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export { assignConfidenceTier };
