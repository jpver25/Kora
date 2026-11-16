# Implementation status — Kora

Última actualización: 2026-11-15 (Phase 1–3 visual AI)

## Listo

| Ítem | Estado | Notas |
| --- | --- | --- |
| Expo Router + TypeScript modular | ✅ | `app/`, `components/`, `services/`, `theme/` |
| Design system + tipografías | ✅ | Nunito + Fraunces, tokens de marca |
| Copy ES-CL | ✅ | `constants/strings.es.ts` |
| Tabs Inicio / Explorar / Escanear / Historial / Perfil | ✅ | Escanear destacado |
| Splash / onboarding con mascota | ✅ | AsyncStorage |
| Barcode scanning + OFF/OBF lookup | ✅ | Expo Go |
| Product result + ScoreRing | ✅ | |
| Historial local | ✅ | |
| Scoring Kora | ✅ | |
| **Visual pipeline Phase 3** | ✅ | Detection → OCR → embedding → search → tiers |
| Confidence UI (auto / candidates / low) | ✅ | `visual-candidates` screen |
| pgvector migration + RPC | ✅ | `002_visual_embeddings.sql` |
| Edge Function `visual-identify` | ✅ | Needs `OPENAI_API_KEY` secret |
| Reference ingestion hooks | ✅ | App service + Node script |
| Fixture measurements | ✅ | `fixtures/packaging/MEASURED_RESULTS.json` |
| Docs | ✅ | + `VISUAL_AI.md` |

## Parcial

| Ítem | Estado | Blocker |
| --- | --- | --- |
| Cloud OCR on device | 🟡 wired | OpenAI / Edge secret missing in this environment |
| CLIP neural embeddings | 🟡 interim hash | Replace Edge embed with CLIP model |
| Catálogo Kora seeded | 🟡 schema | Supabase project + ingest |
| On-device ML Kit detection | ⬜ | Needs expo-dev-client / EAS |

## Blockers externos (exactos)

1. **`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`**
2. **Vision provider:** Supabase secret `OPENAI_API_KEY` for Edge Function, or dev `EXPO_PUBLIC_OPENAI_API_KEY`
3. **EAS `projectId`** placeholder — only needed for Dev Client / store
4. **Apple Developer** — TestFlight/store only
5. **Empty reference image table** until ingest runs against a live Supabase

## Qué funciona en Expo Go (iPhone)

- Todo Phase 1/2 (tabs, barcode, ficha, historial)
- Modo Visual: captura frame, corre pipeline
- Sin proveedor de visión: mensaje honesto, **cero productos inventados**
- Con OpenAI/Edge configurado: OCR → búsqueda OFF real → tiers / ficha
- pgvector: cuando Supabase + migration 002 + referencias existan

## Medición fixtures

`npm run test:visual` → **3/3 pass** (con matices OCR en thumbs 400px; ver `VISUAL_AI.md`)
