-- ====================================================================
-- Cabin photos for the live pricing page — run once in the Supabase
-- SQL editor (same project as invitations.sql).
--
-- Creates a PUBLIC storage bucket named `cabin-photos`. HHT staff
-- upload cabin pictures there (Supabase dashboard → Storage →
-- cabin-photos) and the pricing page shows them automatically:
--   V4.jpg                    → only the category-V4 card
--   Ocean View Balcony.jpg    → every card of that cabin type
-- ====================================================================

insert into storage.buckets (id, name, public)
values ('cabin-photos', 'cabin-photos', true)
on conflict (id) do update set public = true;

-- Guests (the pricing page) may list and read the photos.
create policy "Public can view cabin photos"
  on storage.objects for select
  using (bucket_id = 'cabin-photos');

-- Logged-in HHT agents may upload / replace / remove photos.
create policy "Agents can manage cabin photos"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'cabin-photos')
  with check (bucket_id = 'cabin-photos');
