import assert from 'node:assert/strict';

const CONFIDENCE = {
  autoOpen: 0.82,
  candidates: 0.45,
  lowConfidence: 0.28,
  rivalGap: 0.12,
  maxCandidates: 5,
};

function assignConfidenceTier(ranked) {
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
  if (weak.length > 0) return { tier: 'low_confidence', candidates: weak };
  return { tier: 'no_match', candidates: [] };
}

assert.equal(assignConfidenceTier([]).tier, 'no_match');
assert.equal(assignConfidenceTier([{ barcode: '1', score: 0.9 }]).tier, 'auto_open');
assert.equal(
  assignConfidenceTier([
    { barcode: '1', score: 0.7 },
    { barcode: '2', score: 0.68 },
  ]).tier,
  'candidates',
);
assert.equal(assignConfidenceTier([{ barcode: '1', score: 0.32 }]).tier, 'low_confidence');
assert.equal(assignConfidenceTier([{ barcode: '1', score: 0.1 }]).tier, 'no_match');

console.log('confidence tiers ok');
