import assert from 'node:assert/strict';

function normalizeBarcode(raw) {
  return raw.replace(/\D/g, '');
}

function isPlausibleBarcode(raw) {
  const cleaned = normalizeBarcode(raw);
  return cleaned.length >= 6 && cleaned.length <= 18;
}

assert.equal(normalizeBarcode('780-1234 567890'), '7801234567890');
assert.equal(isPlausibleBarcode('3017620422003'), true);
assert.equal(isPlausibleBarcode('12'), false);
assert.equal(isPlausibleBarcode('abc'), false);
assert.equal(isPlausibleBarcode('5449000000996'), true);

console.log('barcode helpers ok');
