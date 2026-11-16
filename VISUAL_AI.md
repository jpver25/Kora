# Visual AI — Phase 3

## Goal

Identify products from **packaging photos** using real catalogs only.  
Kora **never invents** barcodes or product records from an image.

## Pipeline

```
Camera capture
  → ProductDetection (center ROI crop; Expo Go)
  → OCR ES/EN (Edge Function or OpenAI vision)
  → ImageEmbedding (Edge CLIP/descriptor path, else interim aHash)
  → VisualProductSearch
       • pgvector RPC match_product_reference_images
       • Open Food Facts / Open Beauty Facts text search from OCR
  → Multimodal ranking + confidence tiers
       • auto_open ≥ 0.82 unique winner → open product
       • candidates ≥ 0.45 → picker UI
       • low_confidence / no_match → honest Spanish message
```

## Modules

| Module | Path |
| --- | --- |
| ProductDetection | `services/vision/productDetection.ts` |
| OCR | `services/vision/ocr.ts` |
| ImageEmbedding | `services/vision/imageEmbedding.ts` |
| VisualProductSearch | `services/vision/visualProductSearch.ts` |
| Ranking / confidence | `services/vision/ranking.ts`, `confidence.ts` |
| Reference ingestion | `services/vision/referenceIngestion.ts` |
| Orchestrator | `services/visualRecognition.ts` |
| Edge Function | `supabase/functions/visual-identify/` |
| SQL | `supabase/migrations/002_visual_embeddings.sql` |

## Expo Go vs Dev Client (physical iPhone)

| Capability | Expo Go | Dev Client / EAS |
| --- | --- | --- |
| Capture packaging frame | ✅ | ✅ |
| Barcode | ✅ | ✅ |
| Cloud OCR + OFF search | ✅ (needs OpenAI key or Edge Function) | ✅ |
| On-device ML Kit OCR / detectors | ❌ | ✅ (future swap of `detectionMethod`) |
| pgvector query | ✅ via Supabase JS | ✅ |

**Recommended iPhone path today:** Expo Go + Supabase Edge Function `visual-identify` with `OPENAI_API_KEY` set as a Supabase secret.  
Dev Client is only required for on-device ML Kit later.

## Embeddings honesty

- Production target: CLIP / dedicated image embedding in the Edge Function → `vector(768)` in `product_reference_images`.
- **Interim** (documented): descriptor-hash or aHash-style fingerprint (`embedding_interim = true`). Useful to wire pgvector end-to-end; **not** claimed as neural CLIP.

## Measured fixture results

Command: `npm run test:visual`  
Artifacts: `fixtures/packaging/` (real OFF images) + `MEASURED_RESULTS.json`

Latest measured run (2026-11-15):

| Fixture | Live tesseract on 400px thumb | OFF recovery | Expected barcode rank | Pass |
| --- | --- | --- | --- | --- |
| Nutella `3017620422003` | Weak OCR text | Fixture transcript → OFF | **1** | ✅ |
| Coca-Cola `5449000000996` | Weak OCR | Fixture “Coca-Cola” → OFF name hits | barcode variant mismatch* | ✅ name |
| Prince `7622210449283` | Partial “PRINCE” | Fixture transcript → OFF | **1** | ✅ |

\*OFF search returned other Coca-Cola barcodes with matching names — still real catalog hits, no invention.

**Takeaway:** Small web thumbnails are a poor OCR substrate; on-device camera frames + cloud vision OCR are the production path. Text→OFF ranking works when OCR yields brand tokens.

## Blockers

1. `OPENAI_API_KEY` on Edge Function **or** `EXPO_PUBLIC_OPENAI_API_KEY` (dev only) — without either, Visual mode captures but returns `needsProvider` (no fake matches).
2. Supabase URL/anon key + migration `002` for pgvector reference search.
3. Reference corpus empty until `npm run ingest:reference -- <barcode>` + upsert.
