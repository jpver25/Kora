# Implementation status — Kora

Última actualización: 2026-11-15 (Phase 5 community)

## Stack de PRs

| Phase | PR | Branch |
| --- | --- | --- |
| 1–2 foundation/barcode | #1 | `cursor/phase1-foundation-87d8` |
| 3 visual AI | #2 | `cursor/phase3-visual-ai-87d8` |
| 4 consumer | #4 | `cursor/phase4-consumer-87d8` |
| 5 community | (this PR) | `cursor/phase5-community-87d8` |

## Phase 5 listo (UI + flujos reales)

| Ítem | Estado | Notas |
| --- | --- | --- |
| Agregar producto faltante (fotos, OCR confirm, draft/submit) | ✅ | `comunidad/contribuir` |
| Ayuda a reconocer (desde visual fallido) | ✅ | CTA en alert de Escanear |
| Correcciones de producto | ✅ | `comunidad/corregir` |
| Reseñas cosméticas (estrellas, texto, útil, reportar) | ✅ | Separadas del puntaje Kora |
| Estados de moderación | ✅ | draft → submitted → under_review → approved/rejected |
| Solicitud a marca (rate limit 24h) | ✅ | `comunidad/marca` |
| Cola local si falta schema | ✅ | AsyncStorage + mensaje honesto |
| Migración `003_community.sql` | ✅ | **no aplicada aún** en el proyecto |

## Supabase

| Check | Estado |
| --- | --- |
| Proyecto `ssdnuypwutvdlpfkylva` auth | ✅ vivo (via `.env` local) |
| Migraciones 001 / 002 / 003 en DB | ⛔ pendientes (SQL Editor) |
| Features remotas de comunidad | ⛔ hasta aplicar 003 (app usa cola local) |

**No afirmar** que inserts remotos / RLS / votes RPC funcionan hasta que el usuario aplique SQL.

## Orden SQL

1. `001_initial_schema.sql`  
2. `002_visual_embeddings.sql`  
3. `003_community.sql`

## Blockers

1. Schema vacío hasta SQL 001–003  
2. Vision OpenAI/Edge opcional  
3. Auth de usuarios reales (guest_key por ahora) — Fase 6
