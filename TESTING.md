# Testing — Kora

## Prerrequisitos

- Node 20+ / npm  
- **Expo Go** en iPhone (prioridad)  
- Opcional: `.env` con Supabase + visión

## Comandos

```bash
npm install
npx expo start
# o
npx expo start --tunnel

npm run lint
npm run typecheck
npm run test:scoring
npm run test:confidence
npm run test:visual
```

## Checklist Expo Go (iPhone)

1. [ ] Metro sin errores rojos  
2. [ ] Splash / onboarding con mascota  
3. [ ] Tabs; Escanear destacado  
4. [ ] Barcode real → ficha con puntaje  
5. [ ] Código manual desconocido → no encontrado  
6. [ ] Historial persiste escaneos  
7. [ ] Perfil avisa si falta Supabase / proveedor de visión  
8. [ ] Modo Visual → **Capturar envase**  
9. [ ] Sin OpenAI/Edge → mensaje `needsProvider`, **sin productos inventados**  
10. [ ] Con visión configurada → candidatos reales OFF o auto-open  
11. [ ] Picker `visual-candidates` abre ficha al elegir  
12. [ ] Perfil → Cuenta: invitado; email sign-up/sign-in (Supabase Auth)  
13. [ ] Tras login: historial/favoritos siguen; mensaje de migración  
14. [ ] Exportar datos / cerrar sesión / solicitar borrado  
15. [ ] Premium screen: estado **gratis**, aviso Expo Go (sin IAP), sin Premium falso  
16. [ ] Tras ~12 escaneos gratis → alerta de límite + CTA Premium  

## Checklist physical iPhone — Development Build (IAP / Apple)

```bash
npx eas build --profile development --platform ios
npx expo start --dev-client
```

1. [ ] Instalar build en iPhone físico (no simulador para compras)  
2. [ ] `.env` con `EXPO_PUBLIC_REVENUECAT_API_KEY` + Supabase  
3. [ ] Sign in with Apple (capability + Supabase Apple provider)  
4. [ ] Sandbox Apple ID → comprar / restaurar  
5. [ ] Entitlement `kora_premium` activo → Perfil muestra Premium  
6. [ ] Sin entitlement → permanece Free (nunca inventar)  
7. [ ] Offline: historial/favoritos/cache; paquete Premium sin snapshot → mensaje honesto  

Detalle: `docs/PREMIUM_AND_IAP.md`

## Fixtures visuales

Imágenes reales OFF en `fixtures/packaging/`.  
Resultados medidos: `fixtures/packaging/MEASURED_RESULTS.json` (ver `VISUAL_AI.md`).

## Dispositivos

| Escenario | Camino |
| --- | --- |
| iPhone + Expo Go | **Preferido** para barcode + cloud visual |
| Simulador | Usar ingreso manual / fixtures Node |
| ML Kit on-device | Requiere Dev Client + EAS (aún no) |
