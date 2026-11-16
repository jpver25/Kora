/** Normalize scanned / typed barcodes to digits only. */
export function normalizeBarcode(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** EAN/UPC-ish length check used before lookup. */
export function isPlausibleBarcode(raw: string): boolean {
  const cleaned = normalizeBarcode(raw);
  return cleaned.length >= 6 && cleaned.length <= 18;
}
