# Arquitectura — Kora

## Visión del loop

`Abrir → Escanear (barcode \| visual) → Identificar → Puntuar → Explicar → Alternativas`

## Capas

| Capa | Ruta | Rol |
| --- | --- | --- |
| UI / navegación | `app/` | Expo Router: gate, onboarding, tabs, ficha, candidatos visuales |
| Componentes | `components/` | Design system, scanner, cards |
| Dominio | `services/` | Lookup, scoring, historial, supabase, **vision/** |
| Tipos | `types/` | `Product`, `vision` |
| Tema | `theme/` | Tokens de marca + tipografía |
| Copy | `constants/strings.es.ts` | Español (Chile) |
| Datos | `supabase/migrations/` | Postgres + pgvector |
| Edge | `supabase/functions/visual-identify/` | OCR / embed server-side |
| Comunidad | `services/communityStore.ts`, `app/comunidad/` | Aportes, correcciones, reseñas, moderación |
| Auth / Premium | `services/auth.ts`, `purchases.ts`, `entitlements.ts`, `offlineCache.ts` | Guest, Apple/email, RevenueCat, límites free |

## Navegación

- `app/index.tsx` — splash gate  
- `app/onboarding.tsx` — carrusel con mascota  
- `app/(tabs)/` — Inicio · Explorar · **Escanear** · Historial · Perfil  
- `app/product/[barcode].tsx` — ficha + ScoreRing  
- `app/visual-candidates.tsx` — picker de coincidencias visuales  

## Identificación

1. **Barcode / manual** → `lookupProductByBarcode` (Kora catalog → OFF → OBF)  
2. **Visual** → `identifyPackagingFromImage`  
   - ProductDetection → OCR → ImageEmbedding → VisualProductSearch → ranking → confidence tier  
   - Detalle: [VISUAL_AI.md](./VISUAL_AI.md)

## Scoring (Kora)

`services/scoring.ts`: Nutri-Score / nutrimentos + aditivos + NOVA + bonus orgánico.  
Bandas: Excelente ≥75 · Bueno ≥50 · Mediocre ≥25 · Malo \<25

## Persistencia

- Local: onboarding + historial (AsyncStorage)  
- Supabase: `products`, `product_reference_images`, `scan_events`, `profiles`

## Expo Go vs Dev Client (iPhone)

| Capacidad | Expo Go | Dev Client / EAS |
| --- | --- | --- |
| Tabs, barcode, OFF lookup | ✅ | ✅ |
| Captura visual + cloud OCR/embed | ✅ | ✅ |
| pgvector via Supabase JS | ✅ | ✅ |
| ML Kit on-device | ❌ | ✅ (futuro) |

## Seguridad

- Preferir Edge Function + secretos de servidor  
- `EXPO_PUBLIC_OPENAI_API_KEY` solo para desarrollo  
- RLS en migraciones; nunca service role en el cliente
