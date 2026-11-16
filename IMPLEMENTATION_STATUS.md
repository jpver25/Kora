# Implementation status — Kora

Última actualización: 2026-11-16 (Phase 6 auth / Premium)

## Stack de PRs

| Phase | PR | Branch |
| --- | --- | --- |
| 1–2 foundation/barcode | #1 | `cursor/phase1-foundation-87d8` |
| 3 visual AI | #2 | `cursor/phase3-visual-ai-87d8` |
| 4 consumer | #4 | `cursor/phase4-consumer-87d8` |
| 5 community | #5 | `cursor/phase5-community-87d8` |
| 6 accounts / Premium | (this PR) | `cursor/phase6-accounts-premium-87d8` |

## Phase 6

| Ítem | Estado | Expo Go | Dev Client |
| --- | --- | --- | --- |
| Guest usage | ✅ | ✅ | ✅ |
| Email auth (Supabase) | ✅ | ✅ | ✅ |
| Sign in with Apple | ✅ código | ⚠️ limitado | ✅ |
| Profile edit / logout | ✅ | ✅ | ✅ |
| Account delete + export (Apple) | ✅ hooks | ✅ local | ✅ + RPC 004 |
| Guest → account migration | ✅ | ✅ | ✅ |
| Free scan limits + entitlements | ✅ | ✅ | ✅ |
| RevenueCat / StoreKit purchases | ✅ path | ❌ | ✅ |
| No fake Premium | ✅ | ✅ | ✅ |
| Offline cache + Premium package design | ✅ | ✅ | ✅ |
| Migración `004_accounts_premium.sql` | ✅ | — | aplicar en SQL |

## Blockers

1. SQL **001–004** aún no aplicados en el proyecto Supabase  
2. Auth Apple: configurar provider + Services ID en Supabase + capability iOS  
3. RevenueCat API key + App Store products + EAS Dev Client para IAP real  
4. Paquete offline CDN/Storage aún no publicado (diseño + hooks listos; sin productos inventados)

Ver `docs/PREMIUM_AND_IAP.md` y `TESTING.md` (sección iPhone físico).
