/**
 * Supabase Edge Function: visual-identify
 *
 * Modes:
 * - ocr: multimodal OCR (OpenAI) — Spanish + English packaging text
 * - embed: returns embedding vector (OpenAI descriptors interim, or CLIP when wired)
 * - identify: OCR + embed payload for the client pipeline
 *
 * Secrets (Supabase dashboard): OPENAI_API_KEY
 * Never invent product barcodes — OCR/embed only; client searches real catalogs.
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Body = {
  mode?: 'ocr' | 'embed' | 'identify';
  imageBase64?: string;
  mimeType?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return json({ error: 'OPENAI_API_KEY missing on Edge Function' }, 503);
    }

    const body = (await req.json()) as Body;
    const mode = body.mode ?? 'identify';
    const mimeType = body.mimeType ?? 'image/jpeg';
    const base64 = body.imageBase64;
    if (!base64) return json({ error: 'imageBase64 required' }, 400);

    if (mode === 'ocr' || mode === 'identify') {
      const ocr = await openAiOcr(apiKey, base64, mimeType);
      if (mode === 'ocr') return json(ocr);
      const embedding = await openAiDescriptorEmbedding(apiKey, base64, mimeType);
      return json({ ...ocr, ...embedding });
    }

    if (mode === 'embed') {
      const embedding = await openAiDescriptorEmbedding(apiKey, base64, mimeType);
      return json(embedding);
    }

    return json({ error: 'unknown mode' }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'unknown' }, 500);
  }
});

async function openAiOcr(apiKey: string, base64: string, mimeType: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'OCR food/cosmetics packaging. Return ONLY JSON {"text":"","brands":[],"product_names":[]}. ES+EN. Do not invent text.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract visible packaging text.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI OCR ${res.status}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw);
  return {
    text: parsed.text ?? '',
    brands: parsed.brands ?? [],
    product_names: parsed.product_names ?? [],
  };
}

async function openAiDescriptorEmbedding(apiKey: string, base64: string, mimeType: string) {
  // Documented interim until a CLIP endpoint is attached.
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_VISION_MODEL') ?? 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Return ONLY JSON {"descriptors":["..."]} with 12 short packaging descriptors. No invented brands.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Visual descriptors.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI embed ${res.status}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw);
  const joined = (parsed.descriptors ?? []).join(' ').toLowerCase();
  const dims = 768;
  const vector = new Array(dims).fill(0);
  for (let i = 0; i < joined.length; i++) {
    vector[i % dims] += (joined.charCodeAt(i) % 89) / 89;
  }
  const norm = Math.sqrt(vector.reduce((s: number, v: number) => s + v * v, 0)) || 1;
  return {
    model: 'edge-gpt4o-mini-descriptor-hash-v1',
    interim: true,
    vector: vector.map((v: number) => v / norm),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
