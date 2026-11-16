-- Phase 6: profiles enrichment + entitlement mirror (source of truth remains StoreKit/RevenueCat)
-- Apply AFTER 001–003.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists guest_key text,
  add column if not exists preferred_locale text default 'es-CL',
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tier text not null check (tier in ('free', 'premium')) default 'free',
  revenuecat_app_user_id text,
  product_id text,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_entitlements enable row level security;

drop policy if exists "entitlements_select_own" on public.user_entitlements;
create policy "entitlements_select_own"
  on public.user_entitlements for select
  using (auth.uid() = user_id);

-- Profiles: allow authenticated users to update/read own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Account deletion request marker (Apple guideline 5.1.1)
create or replace function public.request_account_deletion()
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  update public.profiles
    set deletion_requested_at = now(),
        updated_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.request_account_deletion() to authenticated;
