# Kora Premium + IAP (Expo)

## Free vs Premium

| Capability | Free | Premium |
| --- | --- | --- |
| Guest usage | Yes | Yes |
| Daily scans (barcode/visual/manual) | 12 / day | Unlimited |
| Healthier alternatives | 1 preview | Full list |
| Offline product cache (seen items) | Yes | Yes |
| Offline catalog package | No | Yes (when package published) |
| Detailed entitlement flags | — | `unlimited_scans`, `healthier_alternatives`, `offline_catalog`, `detailed_breakdown`, `unlimited_visual` |

**Never fake Premium.** `isPremium` is true only after RevenueCat reports entitlement `kora_premium` active.

## Expo Go vs Development Build

| Feature | Expo Go | EAS Dev Client / production |
| --- | --- | --- |
| Guest + email auth (Supabase) | ✅ | ✅ |
| Scan limits / free entitlements UI | ✅ | ✅ |
| Offline cache (history, favorites, products) | ✅ | ✅ |
| Sign in with Apple | ⚠️ iOS Expo Go may work; prefer Dev Client + capability | ✅ (requires Apple capability) |
| StoreKit / RevenueCat purchases | ❌ | ✅ `react-native-purchases` |
| Restore purchases | ❌ | ✅ |

## Setup (physical iPhone)

1. Apply SQL `001`→`004` in Supabase; enable **Email** + **Apple** providers in Auth.
2. Create App Store Connect products: `kora_premium_monthly`, `kora_premium_yearly`.
3. RevenueCat: entitlement `kora_premium`, offerings linked to those products.
4. Local `.env` (gitignored):

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_REVENUECAT_API_KEY=appl_...
```

5. Dev Client:

```bash
npx eas build --profile development --platform ios
# install on device, then
npx expo start --dev-client
```

6. Sandbox Apple ID → purchase / restore on device. Confirm Perfil / Premium shows **Premium activo** only after StoreKit confirms.
