-- ====================================================================
-- COMPLETE SETUP for the quinceañera invitation system.
-- Paste this whole file into the Supabase SQL editor and run it once.
-- It is SAFE TO RE-RUN — every step skips what already exists, so it
-- doesn't matter which earlier setup files you did or didn't run.
--
-- Covers: invitations table · sail_date column · family edit keys ·
-- family update function · cabin-photos bucket · invitation-photos
-- bucket · all row-level-security policies.
-- ====================================================================

-- 1. Invitations table -----------------------------------------------
create table if not exists public.invitations (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  reservation_id   text,
  quinceanera_name text not null,
  preferred_name   text not null,
  group_name       text,
  family_message   text,
  signature        text,
  hero_image_url   text,
  image_position   text,
  registry_url     text,
  starting_price   text,
  ship             text,
  sailing_dates    text,
  agent_name       text,
  agent_phone      text,
  agent_whatsapp   text,
  agent_email      text,
  status           text not null default 'active'
                   check (status in ('active', 'disabled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 2. Sail date column (per-sailing pricing + report filtering) --------
alter table public.invitations
  add column if not exists sail_date date;

alter table public.invitations enable row level security;

do $$ begin
  create policy "Public can view active invitations"
    on public.invitations for select
    using (status = 'active');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Agents can manage invitations"
    on public.invitations for all
    to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

-- 3. Family edit keys --------------------------------------------------
create table if not exists public.invitation_edit_keys (
  invitation_id uuid primary key references public.invitations(id) on delete cascade,
  edit_key      text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at    timestamptz not null default now()
);

alter table public.invitation_edit_keys enable row level security;

do $$ begin
  create policy "Agents can manage edit keys"
    on public.invitation_edit_keys for all
    to authenticated
    using (true)
    with check (true);
exception when duplicate_object then null; end $$;

-- Give every existing invitation an edit key.
insert into public.invitation_edit_keys (invitation_id)
select id from public.invitations
on conflict (invitation_id) do nothing;

-- 4. The one function families use to update their page ----------------
create or replace function public.update_invitation_by_key(
  p_slug           text,
  p_key            text,
  p_family_message text,
  p_signature      text,
  p_hero_image_url text,
  p_image_position text,
  p_registry_url   text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select i.id into v_id
  from invitations i
  join invitation_edit_keys k on k.invitation_id = i.id
  where i.slug = p_slug
    and k.edit_key = p_key
    and i.status = 'active';

  if v_id is null then
    return false;
  end if;

  update invitations set
    family_message = nullif(trim(p_family_message), ''),
    signature      = nullif(trim(p_signature), ''),
    hero_image_url = nullif(trim(p_hero_image_url), ''),
    image_position = nullif(trim(p_image_position), ''),
    registry_url   = nullif(trim(p_registry_url), ''),
    updated_at     = now()
  where id = v_id;

  return true;
end;
$$;

grant execute on function public.update_invitation_by_key to anon, authenticated;

-- 5. Cabin photos bucket (pricing page room pictures) -------------------
insert into storage.buckets (id, name, public)
values ('cabin-photos', 'cabin-photos', true)
on conflict (id) do update set public = true;

do $$ begin
  create policy "Public can view cabin photos"
    on storage.objects for select
    using (bucket_id = 'cabin-photos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Agents can manage cabin photos"
    on storage.objects for all
    to authenticated
    using (bucket_id = 'cabin-photos')
    with check (bucket_id = 'cabin-photos');
exception when duplicate_object then null; end $$;

-- 6. Family photo uploads bucket ----------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invitation-photos', 'invitation-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

do $$ begin
  create policy "Public can view invitation photos"
    on storage.objects for select
    using (bucket_id = 'invitation-photos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can upload invitation photos"
    on storage.objects for insert
    to anon, authenticated
    with check (bucket_id = 'invitation-photos');
exception when duplicate_object then null; end $$;
