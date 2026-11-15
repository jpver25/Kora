import assert from 'node:assert/strict';

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function nutriScoreToPoints(grade) {
  if (!grade) return null;
  switch (grade.toLowerCase()) {
    case 'a':
      return 90;
    case 'b':
      return 75;
    case 'c':
      return 55;
    case 'd':
      return 35;
    case 'e':
      return 15;
    default:
      return null;
  }
}

function bandFromScore(value) {
  if (value == null) return 'unknown';
  if (value >= 75) return 'excellent';
  if (value >= 50) return 'good';
  if (value >= 25) return 'mediocre';
  return 'bad';
}

function score({ nutriscoreGrade, additivesCount = 0, novaGroup = null }) {
  const nutrition = nutriScoreToPoints(nutriscoreGrade) ?? 50;
  let additivesPart = 20;
  if (additivesCount === 0) additivesPart = 20;
  else if (additivesCount <= 2) additivesPart = 10;
  else if (additivesCount <= 5) additivesPart = 0;
  else if (additivesCount <= 8) additivesPart = -15;
  else additivesPart = -30;
  let processing = 0;
  if (novaGroup === 1) processing = 15;
  else if (novaGroup === 2) processing = 8;
  else if (novaGroup === 3) processing = -5;
  else if (novaGroup === 4) processing = -20;
  const value = clamp(Math.round(nutrition + additivesPart + processing));
  return { value, band: bandFromScore(value) };
}

const a = score({ nutriscoreGrade: 'a', additivesCount: 0, novaGroup: 1 });
assert.equal(a.band, 'excellent');
assert.ok(a.value >= 75);

const e = score({ nutriscoreGrade: 'e', additivesCount: 10, novaGroup: 4 });
assert.equal(e.band, 'bad');

console.log('scoring smoke ok', { a, e });
