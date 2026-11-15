# Implementation status — Kora

Última actualización: 2026-11-15 (Phase 1 + avance Phase 2)

## Listo en este PR

| Ítem | Estado | Notas |
| --- | --- | --- |
| Expo Router + TypeScript modular | ✅ | `app/`, `components/`, `services/`, `theme/` |
| Design system + tipografías | ✅ | Nunito + Fraunces, tokens de marca |
| Copy ES-CL | ✅ | `constants/strings.es.ts` |
| Tabs Inicio / Explorar / Escanear / Historial / Perfil | ✅ | Escanear destacado |
| Splash gate + onboarding con mascota | ✅ | AsyncStorage flag |
| Cámara unificada Auto / Código / Visual | ✅ | Visual = hook Fase 3 |
| Barcode scanning real (`expo-camera`) | ✅ | EAN/UPC/Code128… + ingreso manual |
| Lookup Open Food Facts / Beauty Facts | ✅ | Red real, no mock fijo |
| Product result shell + ScoreRing | ✅ | Explicación + nutrimentos + aditivos |
| Historial local | ✅ | AsyncStorage |
| Scoring Kora original | ✅ | `services/scoring.ts` |
| Supabase client + migration skeleton | ✅ | Requiere keys del usuario |
| Docs README / ARCHITECTURE / TESTING / DATABASE_SETUP | ✅ | |

## En progreso / parcial (Phase 2+)

| Ítem | Estado | Blocker |
| --- | --- | --- |
| Catálogo Kora en Postgres | 🟡 schema only | Crear proyecto Supabase + aplicar SQL + seeds |
| Alternativas reales | 🟡 UI shell | Necesita catálogo + ranking |
| Auth / perfiles | 🟡 schema only | Supabase Auth + UI login |
| Sync historial a `scan_events` | ⬜ | Auth + keys |

## Pendiente (fases posteriores)

| Fase | Ítem |
| --- | --- |
| 3 | IA visual de empaque + embeddings `pgvector` |
| 4 | Preferencias dietarias, listas, profundidad educativa |
| 5 | Comunidad / reportes |
| 6 | Premium / suscripciones |
| 7 | Producción (EAS Store, monitoring) |

## Blockers externos (exactos)

1. **`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`** — no están en el repo; sin ellas el cliente Supabase queda `null` y el lookup usa solo OFF.  
2. **Proyecto EAS** — `extra.eas.projectId` es placeholder; necesario para builds iOS de desarrollo/producción.  
3. **Cuenta Apple Developer** — para TestFlight / App Store (no bloquea Expo Go).  
4. **Modelo visual / API** — Fase 3; el stub `recognizeProductVisually` ya está cableado al modo Visual.

## Qué funciona hoy en Expo Go

- Onboarding, tabs, home con recientes  
- Cámara + escaneo de barcode + búsqueda manual  
- Ficha de producto con puntaje Kora desde datos OFF  
- Historial y perfil (aviso si falta Supabase)
