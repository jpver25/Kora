import type { ImageEmbedding, VisionProviderId } from '@/types/vision';
import { getActiveVisionProvider } from '@/services/vision/ocr';

/** Target dims for pgvector column (CLIP-like). Interim aHash is expanded to this size. */
export const EMBEDDING_DIMS = 768;

function resolveOpenAiKey(): string | null {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim() || null;
}

function resolveVisionEdgeUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_KORA_VISION_URL?.trim();
  if (explicit) return explicit;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/visual-identify`;
  return null;
}

function l2normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

/**
 * Documented interim fingerprint (average-hash style) when CLIP/OpenAI is unavailable.
 * NOT a neural embedding — stored only so the pgvector path can be exercised end-to-end.
 */
export function interimAverageHashEmbedding(base64: string): ImageEmbedding {
  const sample = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const raw: number[] = new Array(EMBEDDING_DIMS).fill(0);
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    raw[i % EMBEDDING_DIMS] += (code % 97) / 97;
  }
  // Emphasize low-frequency buckets so similar crops correlate weakly.
  for (let i = 0; i < 64; i++) {
    raw[i] *= 1.8;
  }
  return {
    provider: 'interim_ahash',
    model: 'interim-ahash-v1',
    dims: EMBEDDING_DIMS,
    vector: l2normalize(raw),
    interim: true,
  };
}

async function embedViaOpenAi(base64: string, mimeType: string): Promise<ImageEmbedding> {
  const key = resolveOpenAiKey();
  if (!key) return interimAverageHashEmbedding(base64);

  // OpenAI multimodal chat used to derive a deterministic pseudo-embedding from
  // structured packaging descriptors when a dedicated CLIP endpoint is absent.
  // Prefer Edge Function + CLIP for production (see supabase/functions/visual-identify).
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.EXPO_PUBLIC_OPENAI_VISION_MODEL?.trim() || 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Describe packaging for retrieval. Return ONLY JSON {"descriptors":["..."]} with 12 short visual/text descriptors. No invented brand if unclear.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Descriptors for visual product search.' },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`Embedding OpenAI falló (${res.status})`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  let descriptors: string[] = [];
  try {
    const parsed = JSON.parse(raw) as { descriptors?: string[] };
    descriptors = parsed.descriptors ?? [];
  } catch {
    descriptors = [];
  }
  const joined = descriptors.join(' ').toLowerCase();
  const vector = new Array(EMBEDDING_DIMS).fill(0);
  for (let i = 0; i < joined.length; i++) {
    vector[i % EMBEDDING_DIMS] += (joined.charCodeAt(i) % 89) / 89;
  }
  return {
    provider: 'openai',
    model: 'gpt-4o-mini-descriptor-hash-v1',
    dims: EMBEDDING_DIMS,
    vector: l2normalize(vector),
    interim: true, // still not CLIP; Edge Function should replace this
  };
}

async function embedViaEdge(base64: string, mimeType: string): Promise<ImageEmbedding> {
  const url = resolveVisionEdgeUrl();
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return interimAverageHashEmbedding(base64);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode: 'embed', imageBase64: base64, mimeType }),
  });
  if (!res.ok) throw new Error(`Embedding Edge falló (${res.status})`);
  const data = (await res.json()) as {
    vector?: number[];
    model?: string;
    interim?: boolean;
  };
  if (!data.vector?.length) return interimAverageHashEmbedding(base64);
  return {
    provider: 'edge',
    model: data.model ?? 'edge-embedding',
    dims: data.vector.length,
    vector: l2normalize(data.vector),
    interim: Boolean(data.interim),
  };
}

/** ImageEmbedding service — CLIP via Edge when available; interim fingerprint otherwise. */
export async function embedPackagingImage(input: {
  base64: string;
  mimeType?: string;
}): Promise<ImageEmbedding> {
  const provider: VisionProviderId = getActiveVisionProvider();
  if (provider === 'edge') {
    return embedViaEdge(input.base64, input.mimeType ?? 'image/jpeg');
  }
  if (provider === 'openai') {
    return embedViaOpenAi(input.base64, input.mimeType ?? 'image/jpeg');
  }
  return interimAverageHashEmbedding(input.base64);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}
