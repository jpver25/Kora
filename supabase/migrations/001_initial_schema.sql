-- Kora Phase 1 schema skeleton
-- Apply via Supabase SQL editor or `supabase db push` once the project exists.

-- Optional: vector search for Phase 3 visual recognition
create extension if not exists vector;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  barcode text unique not null,
  name text not null,
  brand text,
  image_url text,
  category text check (category in ('food', 'beauty', 'unknown')) default 'unknown',
  ingredients_text text,
  additives jsonb not null default '[]'::jsonb,
  nutriscore_grade text,
  nova_group int,
  labels text[] default '{}',
  categories_tags text[] default '{}',
  nutriments jsonb not null default '{}'::jsonb,
  kora_score int,
  embedding vector(768),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_barcode_idx on public.products (barcode);
create index if not exists products_category_idx on public.products (category);

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  barcode text,
  method text check (method in ('barcode', 'visual', 'manual')) not null,
  product_id uuid references public.products (id) on delete set null,
  score int,
  created_at timestamptz not null default now()
);

create index if not exists scan_events_user_idx on public.scan_events (user_id, created_at desc);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'es-CL',
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.scan_events enable row level security;
alter table public.profiles enable row level security;

-- Public read of catalog products (anon) — tighten later if needed
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  using (true);

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "scan_events_self" on public.scan_events;
create policy "scan_events_self"
  on public.scan_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
