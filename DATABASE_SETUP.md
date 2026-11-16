# Database setup — Supabase

## Proyecto enlazado (Kora)

- **Project ref:** `ssdnuypwutvdlpfkylva`
- **URL:** `https://ssdnuypwutvdlpfkylva.supabase.co`

La app lee `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` desde un archivo **`.env` local gitignored** (nunca commits ni PRs con el JWT).

```bash
cp .env.example .env
# Completa URL + anon key del dashboard (Settings → API)
npx expo start -c
```

Estado verificado desde este entorno:

| Check | Resultado |
| --- | --- |
| Auth health (`/auth/v1/health`) | ✅ proyecto vivo |
| REST `products` | ⚠️ tabla aún no existe (`PGRST205`) |
| CLI `supabase db push` | ⛔ bloqueado sin `supabase login` / `SUPABASE_ACCESS_TOKEN` ni DB password |

## Aplicar migraciones (requerido)

En el [SQL Editor](https://supabase.com/dashboard/project/ssdnuypwutvdlpfkylva/sql) del proyecto, ejecuta **en orden**:

1. `supabase/migrations/001_initial_schema.sql` — `products`, `scan_events`, `profiles`, extensión `vector`, RLS  
2. `supabase/migrations/002_visual_embeddings.sql` — `product_reference_images` + RPC `match_product_reference_images`  
3. `supabase/migrations/003_community.sql` — aportes, correcciones, reseñas cosméticas, votos/reportes, solicitudes a marca + moderación  
4. `supabase/migrations/004_accounts_premium.sql` — perfiles enriquecidos, mirror de entitlements, RPC `request_account_deletion`

Luego recarga el schema cache (o espera unos segundos) y confirma en Perfil: **Supabase conectado**.

Hasta que existan las tablas, la app **guarda aportes en cola local** y muestra un aviso — no inventa productos ni afirma sync remoto.

**Auth:** en Dashboard → Authentication habilita Email y Apple. Premium real requiere RevenueCat + Dev Client (ver `docs/PREMIUM_AND_IAP.md`). **No** se marca Premium activo sin StoreKit/RC.

### Alternativa CLI (cuando tengas acceso)

```bash
npx supabase login
npx supabase link --project-ref ssdnuypwutvdlpfkylva
npx supabase db push
```

O con token CI:

```bash
export SUPABASE_ACCESS_TOKEN=...   # no lo commits
npx supabase link --project-ref ssdnuypwutvdlpfkylva
npx supabase db push
```

## Edge Function (visión, opcional)

```bash
npx supabase functions deploy visual-identify --project-ref ssdnuypwutvdlpfkylva
npx supabase secrets set OPENAI_API_KEY=... --project-ref ssdnuypwutvdlpfkylva
```

## Seed de prueba (opcional)

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

Nutrimentos aceptan claves OFF (`sugars_100g`) o camelCase (`sugars100g`); el cliente las normaliza.

## Blockers actuales

1. **Migraciones no aplicadas** en el proyecto (anon funciona; schema vacío).  
2. **Sin service role / CLI login** en este agente → no se pudo `db push` automáticamente.  
3. Service role **nunca** va en la app ni en git.
