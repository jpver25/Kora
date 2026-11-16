# Kora

Escáner inteligente de alimentos y cosméticos para Chile.  
**Sabe qué estás comprando.**

Stack: **React Native · Expo · TypeScript · Expo Router · Expo Camera · Supabase · pgvector**.  
UI en **español (Chile)**. Flujo principal: **Expo Go en iPhone**.

## Arranque rápido (Expo Go — iPhone end-to-end)

```bash
npm install
cp .env.example .env   # opcional: Supabase + visión (nunca commits secrets)
npm run typecheck
npm run test:unit
npx expo start
# o con túnel si la red local falla:
npx expo start --tunnel
```

1. Abre **Expo Go** en el iPhone y escanea el QR de Metro.  
2. Completa onboarding → tabs (Escanear destacado).  
3. Escanea un EAN real o **Ingresar código** (`3017620422003`).  
4. Revisa ficha, historial, favoritos, Preferencias.  
5. Perfil → Cuenta (invitado / email) y Premium (estado gratis en Expo Go).  
6. Visual sin OpenAI/Edge → mensaje honesto, sin productos inventados.  

Detalle de checklist: [TESTING.md](./TESTING.md)

### Escanear

- **Código / Auto:** apunta un EAN/UPC o usa **Ingresar código**  
  Pruebas OFF: `3017620422003` (Nutella), `5449000000996` (Coca-Cola)
- **Visual:** **Capturar envase** → OCR + búsqueda en catálogos reales  
  Sin proveedor de visión: mensaje honesto (no inventa productos)  
  Con Edge/OpenAI: tiers `auto_open` / candidatos / baja confianza

### Visión (Phase 3)

1. Aplica migraciones `001` + `002` en Supabase  
2. Despliega `supabase/functions/visual-identify` y setea secret `OPENAI_API_KEY`  
3. O (dev) `EXPO_PUBLIC_OPENAI_API_KEY` en `.env`  

Detalle: [VISUAL_AI.md](./VISUAL_AI.md)

### Cuentas y Premium (Phase 6)

- Perfil → **Cuenta**: invitado, email Supabase, Sign in with Apple (iOS)  
- Perfil → **Kora Premium**: límites free, ofertas RevenueCat  
- **Expo Go:** auth + límites gratis ✅ · **compras IAP ❌** (usar Dev Client)  
- Nunca se muestra Premium activo sin StoreKit/RevenueCat  

Detalle: [docs/PREMIUM_AND_IAP.md](./docs/PREMIUM_AND_IAP.md) · checklist iPhone en [TESTING.md](./TESTING.md)

### ¿Cuándo hace falta EAS / Dev Client?

- **Expo Go:** barcode, OCR cloud, auth email, límites free, comunidad local  
- **Dev Client / EAS:** compras in-app (RevenueCat), Sign in with Apple fiable, módulos nativos  

```bash
npx eas build --profile development --platform ios
npx expo start --dev-client
```

## Tests

```bash
npm run typecheck
npm run test:scoring
npm run test:confidence
npm run test:visual          # fixtures OFF reales + medición honesta
```

## Documentación

| Doc | Contenido |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Módulos y navegación |
| [VISUAL_AI.md](./VISUAL_AI.md) | Pipeline visual, mediciones, Expo Go |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | Listo / blockers |
| [TESTING.md](./TESTING.md) | Checklist dispositivo |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Supabase SQL 001–004 |
| [docs/PREMIUM_AND_IAP.md](./docs/PREMIUM_AND_IAP.md) | Free/Premium, Expo Go vs Dev Client |
| [docs/SECURITY_REVIEW.md](./docs/SECURITY_REVIEW.md) | Secrets + RLS checklist |
| [docs/APP_STORE_CHECKLIST.md](./docs/APP_STORE_CHECKLIST.md) | Privacy labels, deletion, IAP |

## Estructura

```
app/                      Expo Router
components/               UI + scanner
services/vision/          Detection, OCR, embedding, search, ranking
supabase/migrations/      001–004 (schema, visual, community, accounts)
supabase/functions/       visual-identify
fixtures/packaging/       imágenes OFF reales + MEASURED_RESULTS.json
```

## Marca

`#163B35` · `#537C65` · `#FAF8F4` · `#C8E77B` · `#FFFFFF` · `#17211D`
