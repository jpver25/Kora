# Database setup — Supabase

## 1. Proyecto

Crea un proyecto Supabase y copia **URL** + **anon key**.

## 2. Env

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Reinicia Metro: `npx expo start -c`

## 3. Migraciones

Ejecuta en orden (SQL Editor o `supabase db push`):

1. `supabase/migrations/001_initial_schema.sql` — products, scan_events, profiles, vector  
2. `supabase/migrations/002_visual_embeddings.sql` — `product_reference_images` + RPC `match_product_reference_images`

Después de ingerir referencias, opcionalmente crea índice IVFFlat/HNSW (comentado en `002`).

## 4. Edge Function (visión)

```bash
supabase functions deploy visual-identify
supabase secrets set OPENAI_API_KEY=sk-...
```

La app llama `{SUPABASE_URL}/functions/v1/visual-identify` automáticamente cuando hay URL + anon key.

## 5. Ingestar imagen de referencia

```bash
# Genera payload interim desde OFF (no inventa productos)
npm run ingest:reference -- 3017620422003
```

Luego upsert a `product_reference_images` (vía `ingestReferenceImage` con Supabase configurado, o SQL).

## 6. Verificar

- Perfil: “Supabase conectado”  
- RPC `match_product_reference_images` responde  
- Visual search puede devolver hits `pgvector` además de OFF

## Blockers

- Sin URL/anon → solo OFF; cliente Supabase `null`  
- Sin `OPENAI_API_KEY` en la function → OCR cloud no corre  
- Service role **nunca** en la app
