# Arquitectura — Kora

## Visión del loop

`Abrir → Escanear (barcode \| visual) → Identificar → Puntuar → Explicar → Alternativas`

## Capas

| Capa | Ruta | Rol |
| --- | --- | --- |
| UI / navegación | `app/` | Expo Router: gate, onboarding, tabs, ficha producto |
| Componentes | `components/` | Design system ligero, scanner, cards |
| Dominio | `services/` | Lookup, scoring, historial, supabase, visual hook |
| Tipos | `types/` | `Product`, historial, reconocimiento visual |
| Tema | `theme/` | Tokens de marca + tipografía |
| Copy | `constants/strings.es.ts` | Español (Chile) |
| Datos | `supabase/migrations/` | Postgres + pgvector skeleton |

## Navegación

- `app/index.tsx` — splash gate + redirect onboarding/tabs  
- `app/onboarding.tsx` — carrusel con mascota / arte de marca  
- `app/(tabs)/` — Inicio · Explorar · **Escanear** · Historial · Perfil  
- `app/product/[barcode].tsx` — shell de resultado + ScoreRing

El tab **Escanear** usa un botón elevado (lime) para destacar el CTA principal.

## Identificación de producto

1. **Barcode / manual** → `lookupProductByBarcode`  
   - Intenta catálogo Supabase (`products`) si hay keys  
   - Fallback: Open Food Facts, luego Open Beauty Facts  
2. **Visual (Fase 3)** → `recognizeProductVisually`  
   - Stub estable que el UI ya invoca en modo Visual  
   - Futuro: captura frame → embedding → `pgvector` / modelo hosted

## Scoring (Kora)

`services/scoring.ts` combina:

- Nutri-Score (si existe) o heurística de nutrimentos  
- Penalización por cantidad de aditivos  
- Ajuste por grupo NOVA  
- Bonus orgánico/bio  

Bandas: Excelente ≥75 · Bueno ≥50 · Mediocre ≥25 · Malo \<25

## Persistencia local

- Onboarding flag + historial de escaneos en **AsyncStorage**  
- Cuando Auth/Supabase estén vivos, `scan_events` y `profiles` toman el relevo

## Expo Go vs Dev Client

| Capacidad | Expo Go | Dev Client / EAS |
| --- | --- | --- |
| Tabs, onboarding, OFF lookup | ✅ | ✅ |
| `expo-camera` barcode | ✅ | ✅ |
| Módulos nativos custom / ML on-device | ❌ | ✅ |

## Seguridad

- Solo `EXPO_PUBLIC_*` en el cliente  
- RLS esbozado en la migración  
- Nunca commitear service role keys
