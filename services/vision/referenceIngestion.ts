import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { embedPackagingImage, EMBEDDING_DIMS } from '@/services/vision/imageEmbedding';
import { parseOcrText } from '@/services/vision/ocr';

export type ReferenceIngestInput = {
  barcode: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  ocrText?: string;
  productId?: string;
};

export type ReferenceIngestResult =
  | { ok: true; barcode: string; embeddingDims: number; interim: boolean; id?: string }
  | { ok: false; reason: string };

/**
 * Reference image ingestion hook — upserts OCR + embedding into Supabase.
 * Safe no-op with clear reason when Supabase is not configured.
 */
export async function ingestReferenceImage(
  input: ReferenceIngestInput,
): Promise<ReferenceIngestResult> {
  if (!input.barcode?.trim()) {
    return { ok: false, reason: 'barcode_required' };
  }
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, reason: 'supabase_not_configured' };
  }
  if (!input.imageBase64 && !input.imageUrl) {
    return { ok: false, reason: 'image_required' };
  }

  const base64 = input.imageBase64;
  if (!base64) {
    // App path expects capture base64. Node scripts download+encode before calling.
    return { ok: false, reason: 'image_base64_required' };
  }

  const embedding = await embedPackagingImage({
    base64,
    mimeType: input.mimeType ?? 'image/jpeg',
  });
  const ocr = parseOcrText(input.ocrText ?? '', input.ocrText ? 'fixture' : 'heuristic');

  const row = {
    barcode: input.barcode.trim(),
    product_id: input.productId ?? null,
    image_url: input.imageUrl ?? null,
    ocr_text: ocr.fullText || null,
    embedding: embedding.vector,
    embedding_model: embedding.model,
    embedding_interim: embedding.interim,
    embedding_dims: embedding.dims || EMBEDDING_DIMS,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('product_reference_images')
    .upsert(row, { onConflict: 'barcode' })
    .select('id')
    .maybeSingle();

  if (error) {
    return { ok: false, reason: error.message };
  }

  return {
    ok: true,
    barcode: row.barcode,
    embeddingDims: embedding.dims,
    interim: embedding.interim,
    id: data?.id,
  };
}
