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

## Fixtures visuales

Imágenes reales OFF en `fixtures/packaging/`.  
Resultados medidos: `fixtures/packaging/MEASURED_RESULTS.json` (ver `VISUAL_AI.md`).

## Dispositivos

| Escenario | Camino |
| --- | --- |
| iPhone + Expo Go | **Preferido** para barcode + cloud visual |
| Simulador | Usar ingreso manual / fixtures Node |
| ML Kit on-device | Requiere Dev Client + EAS (aún no) |
