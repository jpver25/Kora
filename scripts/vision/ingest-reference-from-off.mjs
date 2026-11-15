/**
 * Reference image ingestion helper (Node).
 * Downloads OFF front image, builds interim embedding, prints SQL/upsert payload.
 * Does NOT invent products — barcode must exist in OFF.
 *
 * Usage: node scripts/vision/ingest-reference-from-off.mjs 3017620422003
 */
import fs from 'node:fs';
import path from 'node:path';

const barcode = process.argv[2];
if (!barcode) {
  console.error('Usage: node scripts/vision/ingest-reference-from-off.mjs <barcode>');
  process.exit(1);
}

const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
  headers: { 'User-Agent': 'KoraApp/1.0 ingest' },
});
const data = await res.json();
if (data.status !== 1 || !data.product) {
  console.error('Product not found in Open Food Facts — refusing to invent.');
  process.exit(2);
}

const imageUrl = data.product.image_front_url || data.product.image_url;
if (!imageUrl) {
  console.error('No front image on OFF product');
  process.exit(3);
}

const imgRes = await fetch(imageUrl);
const buf = Buffer.from(await imgRes.arrayBuffer());
const base64 = buf.toString('base64');

// Interim aHash-like embedding (same algorithm as app interim path)
const DIMS = 768;
const sample = base64.replace(/[^A-Za-z0-9+/]/g, '');
const raw = new Array(DIMS).fill(0);
for (let i = 0; i < sample.length; i++) {
  raw[i % DIMS] += (sample.charCodeAt(i) % 97) / 97;
}
for (let i = 0; i < 64; i++) raw[i] *= 1.8;
const norm = Math.sqrt(raw.reduce((s, v) => s + v * v, 0)) || 1;
const vector = raw.map((v) => v / norm);

const outDir = path.resolve('fixtures/packaging/ingest-out');
fs.mkdirSync(outDir, { recursive: true });
const payload = {
  barcode,
  name: data.product.product_name,
  brand: data.product.brands ?? null,
  imageUrl,
  embedding_model: 'interim-ahash-v1',
  embedding_interim: true,
  embedding_dims: DIMS,
  embedding: vector,
  note: 'Upsert via ingestReferenceImage when Supabase keys exist, or SQL insert.',
};
const outFile = path.join(outDir, `${barcode}.json`);
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
console.log('Wrote', outFile);
console.log('Product:', payload.name, '| interim embedding dims', DIMS);
