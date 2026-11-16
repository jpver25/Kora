-- Harden product_reference_images: revoke open anon write policies from 002.
-- Service role bypasses RLS for ingest scripts / Edge Functions.

drop policy if exists "reference_images_service_write" on public.product_reference_images;
drop policy if exists "reference_images_service_update" on public.product_reference_images;

-- Keep public read for similarity UX; writes only via service role.
-- (No insert/update policies for anon/authenticated.)
