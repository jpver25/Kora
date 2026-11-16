import assert from 'node:assert/strict';

function evaluatePalm(text) {
  return /\bpalm\b|\baceite de palma\b|\bhuile de palme\b/.test(text);
}

assert.equal(evaluatePalm('aceite de palma refinado'), true);
assert.equal(evaluatePalm('acite de palma'), false); // typo must not match incorrectly as the only signal
assert.equal(evaluatePalm('palm oil'), true);
assert.equal(evaluatePalm('sin aceite'), false);

function matchesScoreFilter(score, minScore, maxScore) {
  const narrowed = (minScore != null && minScore > 0) || (maxScore != null && maxScore < 100);
  if (narrowed && score == null) return false;
  if (score != null) {
    if (minScore != null && score < minScore) return false;
    if (maxScore != null && score > maxScore) return false;
  }
  return true;
}

assert.equal(matchesScoreFilter(null, 0, 100), true);
assert.equal(matchesScoreFilter(null, 40, 100), false);
assert.equal(matchesScoreFilter(55, 0, 100), true);
assert.equal(matchesScoreFilter(20, 40, 100), false);

console.log('preferences + score filter ok');
