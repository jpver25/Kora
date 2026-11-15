# Database setup — Supabase

## 1. Crear proyecto

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto (región cercana a Chile, p.ej. South America si está disponible).  
2. Copia **Project URL** y **anon public key**.

## 2. Variables de entorno

```bash
cp .env.example .env
```

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Reinicia Metro (`npx expo start -c`) para cargar env.

## 3. Aplicar migración

Archivo: `supabase/migrations/001_initial_schema.sql`

Opciones:

- SQL Editor en el dashboard → pegar y Run  
- CLI: `supabase db push` (si inicializas `supabase link`)

La migración crea:

- `products` (catálogo + columna `embedding vector(768)` para Fase 3)  
- `scan_events`  
- `profiles`  
- RLS básica (lectura pública de productos; self-access en perfiles/eventos)

> Nota: si `create policy if not exists` no está disponible en tu versión, elimina el `if not exists` o usa `drop policy` previo. El archivo del repo usa sintaxis compatible con Postgres reciente de Supabase; ajusta si el editor reclama.

## 4. Verificar desde la app

- Perfil deja de mostrar “Supabase no configurado”  
- `lookupProductByBarcode` consulta `products` antes de OFF

## 5. Seeds (opcional)

Inserta un producto de prueba:

```sql
insert into public.products (barcode, name, brand, category, nutriscore_grade, nutriments)
values (
  '7809999999999',
  'Yogur ejemplo Kora',
  'Kora Demo',
  'food',
  'b',
  '{"sugars_100g": 8, "salt_100g": 0.1, "proteins_100g": 4}'::jsonb
);
```

## Blockers

- Sin URL/anon key → cliente `null` (app sigue con OFF).  
- Service role **nunca** va en la app.  
- Auth email/OAuth se cablea en Fase 6.
