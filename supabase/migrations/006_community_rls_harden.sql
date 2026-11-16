-- Harden community RLS: clients cannot self-approve; tighten select; report RPC.
-- Idempotent vs 003: drop every historical policy name before recreating.

-- Contributions: insert only draft/submitted; no public dump of all rows
drop policy if exists "contributions_insert" on public.product_contributions;
create policy "contributions_insert"
  on public.product_contributions for insert
  with check (status in ('draft', 'submitted'));

-- Drop all select-policy aliases from earlier revisions of 003/006.
drop policy if exists "contributions_select" on public.product_contributions;
drop policy if exists "contributions_select_own_guest" on public.product_contributions;
drop policy if exists "contributions_select_own" on public.product_contributions;
-- Authenticated users read their own rows. Guest inserts use client-generated
-- UUIDs and do not rely on SELECT RETURNING (anon must not dump all guest rows).
create policy "contributions_select_own"
  on public.product_contributions for select
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "corrections_insert" on public.product_corrections;
create policy "corrections_insert"
  on public.product_corrections for insert
  with check (status in ('draft', 'submitted'));

drop policy if exists "corrections_select" on public.product_corrections;
drop policy if exists "corrections_select_own" on public.product_corrections;
create policy "corrections_select_own"
  on public.product_corrections for select
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "reviews_insert" on public.cosmetic_reviews;
create policy "reviews_insert"
  on public.cosmetic_reviews for insert
  with check (status in ('draft', 'submitted'));

drop policy if exists "reviews_select_approved" on public.cosmetic_reviews;
drop policy if exists "reviews_select_public" on public.cosmetic_reviews;
create policy "reviews_select_public"
  on public.cosmetic_reviews for select
  using (status in ('approved', 'submitted', 'under_review'));

drop policy if exists "brand_requests_insert" on public.brand_improvement_requests;
create policy "brand_requests_insert"
  on public.brand_improvement_requests for insert
  with check (status in ('draft', 'submitted'));

drop policy if exists "brand_requests_select" on public.brand_improvement_requests;
drop policy if exists "brand_requests_select_own" on public.brand_improvement_requests;
create policy "brand_requests_select_own"
  on public.brand_improvement_requests for select
  using (auth.uid() is not null and user_id = auth.uid());

-- No anon UPDATE policies: status transitions to approved/rejected are service-role only.

create or replace function public.report_cosmetic_review(
  p_review_id uuid,
  p_guest_key text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
as $$
begin
  insert into public.cosmetic_review_reports (review_id, guest_key, reason)
  values (p_review_id, p_guest_key, p_reason)
  on conflict (review_id, guest_key) do nothing;

  if found then
    update public.cosmetic_reviews
      set report_count = report_count + 1,
          status = 'under_review',
          updated_at = now()
    where id = p_review_id;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.report_cosmetic_review(uuid, text, text) to anon, authenticated;
