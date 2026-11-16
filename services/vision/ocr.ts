import type { OcrResult, OcrToken, VisionProviderId } from '@/types/vision';

const STOP = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'el',
  'la',
  'los',
  'las',
  'de',
  'del',
  'y',
  'en',
  'un',
  'una',
  'por',
  'con',
  'para',
  'que',
  'ingredientes',
  'ingredients',
  'net',
  'peso',
  'weight',
  'ml',
  'g',
  'kg',
  'oz',
]);

function detectLanguages(text: string): Array<'es' | 'en'> {
  const lower = text.toLowerCase();
  const langs: Array<'es' | 'en'> = [];
  if (/[áéíóúñ¿¡]/.test(lower) || /\b(ingredientes|azúcar|leche|sin)\b/.test(lower)) {
    langs.push('es');
  }
  if (/\b(ingredients|sugar|milk|organic|net)\b/.test(lower)) {
    langs.push('en');
  }
  if (langs.length === 0) langs.push('es', 'en');
  return langs;
}

function tokenize(text: string): OcrToken[] {
  const languages = detectLanguages(text);
  return text
    .split(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP.has(t.toLowerCase()))
    .slice(0, 40)
    .map((t) => ({
      text: t,
      language: languages[0] ?? 'unknown',
      confidence: 0.6,
    }));
}

function brandAndNameGuesses(text: string): { brands: string[]; names: string[] } {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && l.length <= 48);
  const brands: string[] = [];
  const names: string[] = [];
  for (const line of lines.slice(0, 8)) {
    if (/^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9\s.&'-]{1,30}$/.test(line)) {
      brands.push(line);
    } else {
      names.push(line);
    }
  }
  return { brands: brands.slice(0, 3), names: names.slice(0, 5) };
}

export function parseOcrText(
  fullText: string,
  provider: OcrResult['provider'],
): OcrResult {
  const cleaned = fullText.replace(/\s+/g, ' ').trim();
  const { brands, names } = brandAndNameGuesses(fullText);
  return {
    provider,
    fullText: cleaned,
    tokens: tokenize(cleaned),
    brandCandidates: brands,
    productNameCandidates: names.length ? names : brands,
    languages: detectLanguages(cleaned),
  };
}

function resolveOpenAiKey(): string | null {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim() || null;
}

/**
 * Edge vision is opt-in via explicit EXPO_PUBLIC_KORA_VISION_URL.
 * Do not infer from catalog Supabase URL alone — undeployed functions look "ready"
 * and abort OCR before OpenAI can run.
 */
function resolveVisionEdgeUrl(): string | null {
  return process.env.EXPO_PUBLIC_KORA_VISION_URL?.trim() || null;
}

export function getActiveVisionProvider(): VisionProviderId {
  if (resolveVisionEdgeUrl() && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) return 'edge';
  if (resolveOpenAiKey()) return 'openai';
  return 'none';
}

/**
 * OCR (Spanish + English) via Edge Function or OpenAI vision.
 * Never invents product text — returns empty OCR when no provider is configured.
 */
export async function extractPackagingText(input: {
  base64: string;
  mimeType?: string;
}): Promise<OcrResult> {
  const provider = getActiveVisionProvider();
  if (provider === 'edge') {
    return ocrViaEdge(input.base64, input.mimeType ?? 'image/jpeg');
  }
  if (provider === 'openai') {
    return ocrViaOpenAi(input.base64, input.mimeType ?? 'image/jpeg');
  }
  return parseOcrText('', 'heuristic');
}

async function ocrViaOpenAi(base64: string, mimeType: string): Promise<OcrResult> {
  const key = resolveOpenAiKey();
  if (!key) return parseOcrText('', 'heuristic');

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
            'You OCR food/cosmetics packaging. Return ONLY JSON: {"text":"...", "brands":[], "product_names":[]}. Languages: Spanish and English. Do not invent brands or products that are not visible.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract visible packaging text (ES/EN). No invented content.',
            },
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

  if (!res.ok) {
    throw new Error(`OCR OpenAI falló (${res.status})`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  let parsed: { text?: string; brands?: string[]; product_names?: string[] } = {};
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    parsed = { text: raw };
  }
  const result = parseOcrText(parsed.text ?? '', 'openai');
  if (parsed.brands?.length) result.brandCandidates = parsed.brands.slice(0, 3);
  if (parsed.product_names?.length) {
    result.productNameCandidates = parsed.product_names.slice(0, 5);
  }
  return result;
}

async function ocrViaEdge(base64: string, mimeType: string): Promise<OcrResult> {
  const url = resolveVisionEdgeUrl();
  const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return parseOcrText('', 'heuristic');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode: 'ocr', imageBase64: base64, mimeType }),
  });
  if (!res.ok) throw new Error(`OCR Edge falló (${res.status})`);
  const data = (await res.json()) as { text?: string; brands?: string[]; product_names?: string[] };
  const result = parseOcrText(data.text ?? '', 'edge');
  if (data.brands?.length) result.brandCandidates = data.brands.slice(0, 3);
  if (data.product_names?.length) result.productNameCandidates = data.product_names.slice(0, 5);
  return result;
}

/** Build OFF search queries from OCR — no invented terms. Prefer short brand-forward queries. */
export function buildSearchQueriesFromOcr(ocr: OcrResult): string[] {
  const parts = [
    ...ocr.brandCandidates,
    ...ocr.productNameCandidates,
    ...ocr.tokens.map((t) => t.text),
  ]
    .map((p) => p.trim())
    .filter(Boolean);
  const unique: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (!unique.some((u) => u.toLowerCase() === key)) unique.push(p);
    if (unique.length >= 8) break;
  }
  if (unique.length === 0 && ocr.fullText.trim()) {
    unique.push(...ocr.fullText.split(/\s+/).filter((t) => t.length >= 3).slice(0, 4));
  }
  if (unique.length === 0) return [];

  const queries: string[] = [];
  // Brand-only / first token often ranks better on OFF than long noisy strings.
  if (unique[0]) queries.push(unique[0]);
  if (unique.length >= 2) queries.push(unique.slice(0, 2).join(' '));
  queries.push(unique.slice(0, 4).join(' '));
  return Array.from(new Set(queries.map((q) => q.trim()).filter(Boolean)));
}

/** @deprecated prefer buildSearchQueriesFromOcr */
export function buildSearchQueryFromOcr(ocr: OcrResult): string | null {
  return buildSearchQueriesFromOcr(ocr)[0] ?? null;
}
