# Kora

Escáner inteligente de alimentos y cosméticos para Chile.  
**Sabe qué estás comprando.**

Stack: **React Native · Expo · TypeScript · Expo Router · Expo Camera · Supabase**.  
UI en **español (Chile)**. Flujo principal: Expo Go en iPhone.

## Arranque rápido (Expo Go)

1. Instala dependencias:

```bash
npm install
```

2. (Opcional) Configura Supabase:

```bash
cp .env.example .env
# Completa EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Sin `.env`, la app igual busca productos en **Open Food Facts** / **Open Beauty Facts**.

3. Inicia Metro:

```bash
npx expo start
```

4. Abre **Expo Go** en el iPhone y escanea el QR.

### Probar el escáner

- Ve a la pestaña **Escanear** (botón lime destacado).
- Permite la cámara.
- Centra un código de barras EAN/UPC, o usa **Ingresar código**.
- Códigos de prueba conocidos en OFF (ejemplos públicos): `3017620422003` (Nutella), `5449000000996` (Coca-Cola).

### Cuando Expo Go no alcanza

Funciones nativas avanzadas (IA on-device, módulos custom) requieren:

```bash
npx eas build --profile development --platform ios
```

y `expo-dev-client`. Documentado en `ARCHITECTURE.md`.

## Documentación

| Doc | Contenido |
| --- | --- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Módulos, navegación, hooks Fase 3 |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | Qué está listo / pendiente |
| [TESTING.md](./TESTING.md) | Checklist Expo Go + casos |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Supabase + migración |

## Estructura

```
app/                 Expo Router (tabs, onboarding, producto)
components/          UI, scanner, product
services/            OFF lookup, scoring, history, supabase, visual hook
theme/               tokens de marca
supabase/migrations/ SQL skeleton + pgvector
assets/images/brand/ mascota e ilustraciones
```

## Marca

Colores: `#163B35` · `#537C65` · `#FAF8F4` · `#C8E77B` · `#FFFFFF` · `#17211D`

## Licencia / datos

Los productos públicos se consultan a Open Food Facts / Open Beauty Facts bajo sus términos.  
El puntaje **Kora** es original (no usa copy ni fórmula propietaria de Yuka).
