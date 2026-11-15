import assert from 'node:assert/strict';

function assignConfidenceTier(ranked) {
  const CONFIDENCE = { autoOpen: 0.82, candidates: 0.45, rivalGap: 0.12, maxCandidates: 5 };
  const usable = ranked.filter((c) => c.barcode && c.score >= CONFIDENCE.candidates).slice(0, CONFIDENCE.maxCandidates);
  if (!usable.length) return { tier: 'no_match', candidates: [] };
  const top = usable[0];
  const rivals = usable.filter((c) => c.barcode !== top.barcode && top.score - c.score <= CONFIDENCE.rivalGap);
  if (top.score >= CONFIDENCE.autoOpen && rivals.length === 0) return { tier: 'auto_open', candidates: [top] };
  if (top.score >= CONFIDENCE.candidates) return { tier: 'candidates', candidates: usable };
  return { tier: 'low_confidence', candidates: usable.slice(0, 3) };
}

assert.equal(assignConfidenceTier([]).tier, 'no_match');
assert.equal(
  assignConfidenceTier([{ barcode: '1', score: 0.9 }]).tier,
  'auto_open',
);
assert.equal(
  assignConfidenceTier([
    { barcode: '1', score: 0.7 },
    { barcode: '2', score: 0.68 },
  ]).tier,
  'candidates',
);
assert.equal(
  assignConfidenceTier([{ barcode: '1', score: 0.2 }]).tier,
  'no_match',
);

console.log('confidence tiers ok');
