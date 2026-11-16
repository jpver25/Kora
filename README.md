# Kora

Escáner inteligente de alimentos y cosméticos para Chile.  
**Sabe qué estás comprando.**

Stack: **React Native · Expo · TypeScript · Expo Router · Expo Camera · Supabase · pgvector**.  
UI en **español (Chile)**. Flujo principal: **Expo Go en iPhone**.

## Arranque rápido (Expo Go)

```bash
npm install
cp .env.example .env   # opcional: Supabase + visión
npx expo start
```

Abre **Expo Go** en el iPhone y escanea el QR.

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

### ¿Cuándo hace falta EAS / Dev Client?

Solo para ML Kit u otros módulos nativos custom.  
**OCR cloud + barcode + pgvector funcionan en Expo Go.**

```bash
npx eas build --profile development --platform ios
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
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Supabase + embeddings + comunidad (001–003) |

## Estructura

```
app/                      Expo Router
components/               UI + scanner
services/vision/          Detection, OCR, embedding, search, ranking
supabase/migrations/      001 schema + 002 visual embeddings
supabase/functions/       visual-identify
fixtures/packaging/       imágenes OFF reales + MEASURED_RESULTS.json
```

## Marca

`#163B35` · `#537C65` · `#FAF8F4` · `#C8E77B` · `#FFFFFF` · `#17211D`
