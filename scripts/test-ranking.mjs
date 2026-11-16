import assert from 'node:assert/strict';

function textOverlapBonus(candidate, ocr) {
  if (!ocr) return 0;
  const hay = `${candidate.name} ${candidate.brand ?? ''}`.toLowerCase();
  let hits = 0;
  let checked = 0;
  const terms = [...ocr.brandCandidates, ...ocr.productNameCandidates, ...ocr.tokens.map((t) => t.text)];
  for (const term of terms.slice(0, 12)) {
    const t = term.toLowerCase();
    if (t.length < 3) continue;
    checked += 1;
    if (hay.includes(t)) hits += 1;
  }
  if (!checked) return 0;
  return Math.min(0.1, (hits / checked) * 0.12);
}

function mergeCandidates(groups) {
  const map = new Map();
  for (const group of groups) {
    for (const c of group) {
      if (!c.barcode) continue;
      const prev = map.get(c.barcode);
      if (!prev) {
        map.set(c.barcode, { ...c, sources: [...c.sources] });
        continue;
      }
      const sources = Array.from(new Set([...prev.sources, ...c.sources]));
      const hasOcr = sources.some((s) => s.startsWith('ocr_'));
      const hasVector = sources.includes('pgvector');
      const boost = hasOcr && hasVector ? 0.05 : 0;
      map.set(c.barcode, {
        ...prev,
        score: Math.min(0.95, Math.max(prev.score, c.score) + boost),
        sources,
      });
    }
  }
  return Array.from(map.values());
}

// Duplicate OCR hits must not inflate past auto_open alone.
const dupes = mergeCandidates([
  [
    { barcode: '1', name: 'X', score: 0.62, sources: ['ocr_off_search'] },
    { barcode: '1', name: 'X', score: 0.62, sources: ['ocr_off_search'] },
    { barcode: '1', name: 'X', score: 0.62, sources: ['ocr_obf_search'] },
  ],
]);
assert.equal(dupes.length, 1);
assert.ok(dupes[0].score < 0.82, `score ${dupes[0].score} should stay below auto_open`);

const multimodal = mergeCandidates([
  [[{ barcode: '2', name: 'Y', score: 0.62, sources: ['ocr_off_search'] }][0]],
  [[{ barcode: '2', name: 'Y', score: 0.7, sources: ['pgvector'] }][0]],
]);
assert.ok(multimodal[0].score >= 0.7);
assert.ok(multimodal[0].score <= 0.95);

const bonus = textOverlapBonus(
  { name: 'Nutella Ferrero', brand: 'Ferrero' },
  { brandCandidates: ['Ferrero'], productNameCandidates: ['Nutella'], tokens: [{ text: 'crema' }] },
);
assert.ok(bonus <= 0.1);

console.log('visual ranking merge ok');
