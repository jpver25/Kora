import type { VisualRecognitionRequest, VisualRecognitionResult } from '@/types/product';

/**
 * Phase 3 hook — visual packaging recognition.
 * Architecture placeholder so scanner UI can call a stable API now.
 */
export async function recognizeProductVisually(
  _request: VisualRecognitionRequest,
): Promise<VisualRecognitionResult> {
  return {
    status: 'not_implemented',
    message:
      'El reconocimiento visual de empaques se implementará en la Fase 3 (modelo + embeddings pgvector).',
  };
}
