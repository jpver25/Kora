import type { ConfidenceTier, VisualCandidate } from '@/types/vision';

/** Thresholds for visual match tiers (0–1 scores). */
export const CONFIDENCE = {
  autoOpen: 0.82,
  candidates: 0.45,
  /** Max relative gap from top score to keep as rival candidate. */
  rivalGap: 0.12,
  maxCandidates: 5,
} as const;

export function assignConfidenceTier(ranked: VisualCandidate[]): {
  tier: ConfidenceTier;
  candidates: VisualCandidate[];
} {
  const usable = ranked
    .filter((c) => c.barcode && c.score >= CONFIDENCE.candidates)
    .slice(0, CONFIDENCE.maxCandidates);

  if (usable.length === 0) {
    return { tier: 'no_match', candidates: [] };
  }

  const top = usable[0];
  const rivals = usable.filter(
    (c) => c.barcode !== top.barcode && top.score - c.score <= CONFIDENCE.rivalGap,
  );

  if (top.score >= CONFIDENCE.autoOpen && rivals.length === 0) {
    return { tier: 'auto_open', candidates: [top] };
  }

  if (top.score >= CONFIDENCE.candidates) {
    return { tier: 'candidates', candidates: usable };
  }

  return { tier: 'low_confidence', candidates: usable.slice(0, 3) };
}
