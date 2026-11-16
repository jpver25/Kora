-- Phase 3: reference packaging images + pgvector similarity RPC
-- Requires migration 001 (vector extension + products).

create table if not exists public.product_reference_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  barcode text not null,
  image_url text,
  storage_path text,
  ocr_text text,
  embedding vector(768),
  embedding_model text,
  embedding_interim boolean not null default true,
  embedding_dims int not null default 768,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (barcode)
);

create index if not exists product_reference_images_barcode_idx
  on public.product_reference_images (barcode);

-- NOTE: Create an IVFFlat/HNSW index AFTER reference images are ingested:
--   create index product_reference_images_embedding_idx
--     on public.product_reference_images
--     using ivfflat (embedding vector_cosine_ops) with (lists = 100);
-- Empty-table IVFFlat builds fail; sequential scan is fine for early catalogs.

alter table public.product_reference_images enable row level security;

drop policy if exists "reference_images_public_read" on public.product_reference_images;
create policy "reference_images_public_read"
  on public.product_reference_images for select
  using (true);

-- Service role / authenticated ingest only (tighten further with auth later)
drop policy if exists "reference_images_service_write" on public.product_reference_images;
create policy "reference_images_service_write"
  on public.product_reference_images for insert
  with check (true);

drop policy if exists "reference_images_service_update" on public.product_reference_images;
create policy "reference_images_service_update"
  on public.product_reference_images for update
  using (true)
  with check (true);

create or replace function public.match_product_reference_images(
  query_embedding vector(768),
  match_count int default 8,
  match_threshold float default 0.35
)
returns table (
  id uuid,
  barcode text,
  name text,
  brand text,
  image_url text,
  similarity float
)
language sql
stable
as $$
  select
    r.id,
    r.barcode,
    coalesce(p.name, r.barcode) as name,
    p.brand,
    coalesce(r.image_url, p.image_url) as image_url,
    (1 - (r.embedding <=> query_embedding))::float as similarity
  from public.product_reference_images r
  left join public.products p on p.id = r.product_id or p.barcode = r.barcode
  where r.embedding is not null
    and (1 - (r.embedding <=> query_embedding)) >= match_threshold
  order by r.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

grant execute on function public.match_product_reference_images(vector, int, float)
  to anon, authenticated;
