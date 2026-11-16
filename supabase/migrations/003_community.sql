-- Phase 5: community contributions, corrections, cosmetic reviews, brand requests
-- Apply AFTER 001_initial_schema.sql and 002_visual_embeddings.sql

create type public.moderation_status as enum (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected'
);

create table if not exists public.product_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  guest_key text,
  barcode text,
  name text,
  brand text,
  category text check (category in ('food', 'beauty', 'unknown')) default 'unknown',
  ocr_text text,
  ocr_confirmed boolean not null default false,
  photo_uris text[] not null default '{}',
  notes text,
  source text check (source in ('missing_product', 'failed_visual', 'manual')) not null default 'missing_product',
  status public.moderation_status not null default 'draft',
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_contributions_status_idx
  on public.product_contributions (status, created_at desc);
create index if not exists product_contributions_barcode_idx
  on public.product_contributions (barcode);

create table if not exists public.product_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  guest_key text,
  barcode text not null,
  field text not null,
  current_value text,
  proposed_value text not null,
  reason text,
  status public.moderation_status not null default 'draft',
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_corrections_barcode_idx
  on public.product_corrections (barcode, created_at desc);

create table if not exists public.cosmetic_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  guest_key text,
  barcode text not null,
  stars int not null check (stars between 1 and 5),
  body text not null check (char_length(body) between 3 and 2000),
  helpful_count int not null default 0,
  report_count int not null default 0,
  status public.moderation_status not null default 'submitted',
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cosmetic_reviews_barcode_idx
  on public.cosmetic_reviews (barcode, created_at desc);
create index if not exists cosmetic_reviews_status_idx
  on public.cosmetic_reviews (status);

create table if not exists public.cosmetic_review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.cosmetic_reviews (id) on delete cascade,
  guest_key text not null,
  created_at timestamptz not null default now(),
  unique (review_id, guest_key)
);

create table if not exists public.cosmetic_review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.cosmetic_reviews (id) on delete cascade,
  guest_key text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (review_id, guest_key)
);

create table if not exists public.brand_improvement_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  guest_key text,
  brand text not null,
  barcode text,
  message text not null check (char_length(message) between 10 and 2000),
  status public.moderation_status not null default 'submitted',
  moderator_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_requests_guest_created_idx
  on public.brand_improvement_requests (guest_key, created_at desc);

alter table public.product_contributions enable row level security;
alter table public.product_corrections enable row level security;
alter table public.cosmetic_reviews enable row level security;
alter table public.cosmetic_review_votes enable row level security;
alter table public.cosmetic_review_reports enable row level security;
alter table public.brand_improvement_requests enable row level security;

-- Anon can insert contributions/corrections/reviews/requests (guest catalog growth).
-- Reads: approved reviews public; own drafts via guest_key filtered client-side / later auth.

drop policy if exists "contributions_insert" on public.product_contributions;
create policy "contributions_insert"
  on public.product_contributions for insert
  with check (true);

drop policy if exists "contributions_select" on public.product_contributions;
create policy "contributions_select"
  on public.product_contributions for select
  using (true);

drop policy if exists "corrections_insert" on public.product_corrections;
create policy "corrections_insert"
  on public.product_corrections for insert
  with check (true);

drop policy if exists "corrections_select" on public.product_corrections;
create policy "corrections_select"
  on public.product_corrections for select
  using (true);

drop policy if exists "reviews_insert" on public.cosmetic_reviews;
create policy "reviews_insert"
  on public.cosmetic_reviews for insert
  with check (true);

drop policy if exists "reviews_select_approved" on public.cosmetic_reviews;
create policy "reviews_select_approved"
  on public.cosmetic_reviews for select
  using (status in ('approved', 'submitted', 'under_review'));

drop policy if exists "review_votes_insert" on public.cosmetic_review_votes;
create policy "review_votes_insert"
  on public.cosmetic_review_votes for insert
  with check (true);

drop policy if exists "review_votes_select" on public.cosmetic_review_votes;
create policy "review_votes_select"
  on public.cosmetic_review_votes for select
  using (true);

drop policy if exists "review_reports_insert" on public.cosmetic_review_reports;
create policy "review_reports_insert"
  on public.cosmetic_review_reports for insert
  with check (true);

drop policy if exists "brand_requests_insert" on public.brand_improvement_requests;
create policy "brand_requests_insert"
  on public.brand_improvement_requests for insert
  with check (true);

drop policy if exists "brand_requests_select" on public.brand_improvement_requests;
create policy "brand_requests_select"
  on public.brand_improvement_requests for select
  using (true);

-- Helpful vote increment (anon-safe RPC)
create or replace function public.vote_cosmetic_review_helpful(
  p_review_id uuid,
  p_guest_key text
)
returns boolean
language plpgsql
security definer
as $$
begin
  insert into public.cosmetic_review_votes (review_id, guest_key)
  values (p_review_id, p_guest_key)
  on conflict (review_id, guest_key) do nothing;

  if found then
    update public.cosmetic_reviews
      set helpful_count = helpful_count + 1,
          updated_at = now()
    where id = p_review_id;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.vote_cosmetic_review_helpful(uuid, text) to anon, authenticated;
