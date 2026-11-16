# Security review notes — Kora

## Secrets

| Item | Status |
| --- | --- |
| `.env` / `.env.local` | gitignored |
| `.env.example` | placeholders only — no real keys |
| Docs / PR bodies | must not paste anon JWT, service role, OpenAI, RevenueCat secrets |
| Client bundle | only `EXPO_PUBLIC_*` (anon) keys; service role never in app |

## RLS checklist (apply SQL 001→005)

| Table / object | Expected |
| --- | --- |
| `products` | public read OK; writes service/admin only |
| `product_reference_images` | public **read**; **no** anon insert/update (005 drops open write policies) |
| `scan_events` / `profiles` | own-row only |
| `product_contributions`, corrections, reviews | insert **only** `draft`/`submitted` (006); no anon self-approve; selects own/public reviews |
| `user_entitlements` | select own; **never** trust client to set Premium |
| Edge `visual-identify` | verify JWT; OpenAI key only in function secrets |

## Auth / Premium

- Guest → account migration is local ownership stamp; no privilege escalation
- Premium only from RevenueCat / StoreKit entitlement `kora_premium`
- Account deletion: in-app request + sign-out (Apple 5.1.1); complete server wipe when ops pipeline exists

## Camera / photos

- Usage strings in `app.json` (ES)
- Contributions store local URIs; do not upload without consent flow

## Residual risks

1. Community insert policies are open while schema is guest-oriented — rate-limit / auth before public launch  
2. Anon Supabase key is public by design — RLS is the real boundary  
3. Interim aHash embeddings are weak — do not treat as cryptographic identity  
