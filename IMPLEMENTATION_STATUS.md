# Implementation status — Kora

Última actualización: 2026-11-16 (Phase 7 production readiness)

## Stack de PRs

| Phase | PR | Branch | Notes |
| --- | --- | --- | --- |
| 1–2 foundation/barcode | #1 | `cursor/phase1-foundation-87d8` | Expo app, OFF lookup, scoring |
| 3 visual AI | #2 | `cursor/phase3-visual-ai-87d8` | OCR/embed/pgvector path |
| 4 consumer | #4 | `cursor/phase4-consumer-87d8` | Home/search/explore/prefs |
| 5 community | #5 | `cursor/phase5-community-87d8` | Contributions/reviews |
| 6 accounts / Premium | #6 | `cursor/phase6-accounts-premium-87d8` | Auth + RC path |
| 7 production | (this) | `cursor/phase7-production-87d8` | Polish, tests, security |

## Honest capability matrix

| Area | Code | Live in prod? |
| --- | --- | --- |
| Barcode → OFF/OBF product + Kora score | ✅ | ✅ with network |
| Visual AI pipeline | ✅ | ⛔ needs OpenAI and/or Edge + SQL 002 |
| Home / search / explore / prefs | ✅ | ✅ (catalog network) |
| Community flows | ✅ | Local queue until SQL 003 |
| Auth email / Apple / Premium UI | ✅ | Auth needs providers; IAP needs Dev Client + RC |
| Premium entitlement | ✅ path | ⛔ no fake Premium; needs StoreKit |
| Reference image writes | ✅ hardened | Apply SQL **005** if 002 already ran with open writes |

## Phase 7 delivered

- Scanner debounce + lock state fix; cancel stale visual recognition  
- Caching (product offline cache from Phase 6)  
- Accessibility labels / Dynamic Type multipliers on empty states  
- ES primary + EN secondary string structure (`constants/strings.en.ts`, `i18n.ts`)  
- Security review + App Store checklist docs  
- Unit tests: scoring, barcode, ranking, preferences, confidence  
- Bugbot criticals from #2/#4 addressed on tip (RLS writes, vision provider detection, merge inflation, scanner lock, favorites list, alternatives error isolation, explore race, palm typo, score filter, low_confidence tier)

## External blockers (still)

1. **Supabase SQL 001→005** not applied on project `ssdnuypwutvdlpfkylva`  
2. **Apple** Sign In provider + App Store Connect + EAS project id  
3. **RevenueCat** API key + products + Dev Client for real IAP  
4. **OpenAI** / Edge `visual-identify` for production vision  
5. Offline Premium CDN package not published  

## Tests

Run `npm run test:unit` — see latest results in PR / `docs/` notes after CI.
