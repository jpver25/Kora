# Implementation status — Kora

Última actualización: 2026-11-15 (Phase 4 consumer + Supabase wiring)

## Listo

| Ítem | Estado | Notas |
| --- | --- | --- |
| Phase 1–3 foundation / barcode / visual pipeline | ✅ | PRs #1–#2 |
| Bugbot fixes (camera focus, nutriments map, SDK 54 pkgs, organic token match, alert lock) | ✅ | en branch Phase 4 |
| Home dashboard (saludo, CTA, recientes, shortcuts, recomendaciones) | ✅ | |
| Búsqueda + filtros (nombre/marca/categoría/código, food/beauty, score) | ✅ | `app/buscar.tsx` + OFF/OBF reales |
| Explorar rankings por categoría | ✅ | catálogo real OFF |
| Historial (búsqueda, método, favoritos) | ✅ | |
| Favoritos | ✅ | AsyncStorage |
| Preferencias dietarias + warnings en ficha | ✅ | |
| Alternativas más sanas (misma categoría, mejor score) | ✅ | solo hits OFF reales |
| Docs + `DATABASE_SETUP` para proyecto `ssdnuypwutvdlpfkylva` | ✅ | sin secrets en git |

## Supabase (este entorno)

| Check | Estado |
| --- | --- |
| `.env` gitignored con URL + anon | ✅ local only |
| Auth health del proyecto | ✅ vivo |
| Tablas `products` / embeddings | ⛔ migraciones pendientes (SQL Editor / CLI login) |
| `supabase db push` desde el agente | ⛔ sin `SUPABASE_ACCESS_TOKEN` / DB password |

## Blockers

1. **Aplicar SQL 001+002** en el dashboard del proyecto (o CLI login).  
2. Vision OpenAI/Edge secret (opcional para OCR cloud).  
3. EAS projectId / Apple — solo Dev Client/store.

## Expo Go

Flujo principal intacto: barcode, visual capture, home/search/explore/history/prefs, ficha con alternativas y warnings.
