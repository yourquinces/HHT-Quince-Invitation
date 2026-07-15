-- ====================================================================
-- Family self-edit for invitation pages — run once in the Supabase
-- SQL editor (same project as invitations.sql).
--
-- Each invitation gets a secret edit key. The family opens
--   https://hht-quince-invitation.netlify.app/i/<slug>/edit?key=<key>
-- (no account needed) and can change ONLY: the welcome message,
-- signature, photo, photo position, and registry link.
--
-- The keys live in their own table with NO public read access, and all
-- family updates go through one function that checks the key, so
-- guests can never see keys or change anything.
-- ====================================================================

create table public.invitation_edit_keys (
  invitation_id uuid primary key references public.invitations(id) on delete cascade,
  edit_key      text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at    timestamptz not null default now()
);

alter table public.invitation_edit_keys enable row level security;

-- Only logged-in HHT agents (QRS) can see or manage keys.
create policy "Agents can manage edit keys"
  on public.invitation_edit_keys for all
  to authenticated
  using (true)
  with check (true);

-- Give every existing invitation an edit key.
insert into public.invitation_edit_keys (invitation_id)
select id from public.invitations
on conflict (invitation_id) do nothing;

-- The one path families can use to update their page. Runs with owner
-- rights (security definer) but only after the slug + key match, and
-- only touches the five family-editable fields.
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

-- Public bucket for the photos families upload from the edit page.
-- Capped at 5 MB per file, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invitation-photos', 'invitation-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

create policy "Public can view invitation photos"
  on storage.objects for select
  using (bucket_id = 'invitation-photos');

create policy "Anyone can upload invitation photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'invitation-photos');
