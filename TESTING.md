# Testing — Kora

## Prerrequisitos

- Node 20+ / npm  
- App **Expo Go** (iOS o Android) en la misma red, o túnel Expo  
- (Opcional) `.env` con Supabase

## Comandos

```bash
npm install
npx expo start
# o
npx expo start --tunnel
```

Lint:

```bash
npm run lint
```

Typecheck:

```bash
npx tsc --noEmit
```

Smoke scoring (sin UI):

```bash
npm run test:scoring
```

## Checklist Expo Go

1. [ ] Arranca Metro sin errores rojos  
2. [ ] Splash muestra mascota / marca Kora  
3. [ ] Onboarding se puede completar u omitir  
4. [ ] Tabs visibles; Escanear es el CTA destacado  
5. [ ] Inicio muestra tip + recientes vacíos  
6. [ ] Explorar muestra categorías  
7. [ ] Escanear pide permiso de cámara y lo respeta  
8. [ ] Escaneo de un EAN real abre ficha con nombre/imagen/puntaje  
9. [ ] Código manual inválido / desconocido muestra “no encontrado”  
10. [ ] Historial lista el escaneo; borrar limpia  
11. [ ] Perfil indica si Supabase falta  
12. [ ] Modo Visual muestra mensaje de Fase 3 (no crashea)

## Casos de datos

| Input | Esperado |
| --- | --- |
| `3017620422003` | Producto OFF (Nutella) + puntaje |
| `5449000000996` | Bebida OFF + puntaje |
| `000000` | No encontrado |
| Barcode cosmético en OBF | Fallback beauty si no está en OFF |

## Dispositivos

- Prioridad: iPhone físico + Expo Go  
- Android Expo Go también válido para barcode  
- Simulador iOS: cámara limitada → usar **Ingresar código**

## Regresión visual rápida

- Cream `#FAF8F4`, primary `#163B35`, accent lime `#C8E77B`  
- Tipografía Fraunces (títulos) / Nunito (cuerpo)  
- Mascot aparece en splash, onboarding y empty states
