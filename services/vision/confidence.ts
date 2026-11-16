import type { ConfidenceTier, VisualCandidate } from '@/types/vision';

/** Thresholds for visual match tiers (0–1 scores). */
export const CONFIDENCE = {
  autoOpen: 0.82,
  /** Strong enough for a multi-choice picker. */
  candidates: 0.45,
  /** Weak hits shown as low-confidence (below candidates floor). */
  lowConfidence: 0.28,
  /** Max relative gap from top score to keep as rival candidate. */
  rivalGap: 0.12,
  maxCandidates: 5,
} as const;

export function assignConfidenceTier(ranked: VisualCandidate[]): {
  tier: ConfidenceTier;
  candidates: VisualCandidate[];
} {
  const withBarcode = ranked.filter((c) => Boolean(c.barcode));

  const strong = withBarcode
    .filter((c) => c.score >= CONFIDENCE.candidates)
    .slice(0, CONFIDENCE.maxCandidates);

  if (strong.length > 0) {
    const top = strong[0];
    const rivals = strong.filter(
      (c) => c.barcode !== top.barcode && top.score - c.score <= CONFIDENCE.rivalGap,
    );

    if (top.score >= CONFIDENCE.autoOpen && rivals.length === 0) {
      return { tier: 'auto_open', candidates: [top] };
    }

    return { tier: 'candidates', candidates: strong };
  }

  const weak = withBarcode
    .filter((c) => c.score >= CONFIDENCE.lowConfidence)
    .slice(0, 3);

  if (weak.length > 0) {
    return { tier: 'low_confidence', candidates: weak };
  }

  return { tier: 'no_match', candidates: [] };
}
