-- A small profile picture for the quinceañera.
--
-- Separate from hero_image_url, which is the big photo on her invitation: this
-- one is a square avatar shown on her hub and on her registration form, and it
-- is cropped and sized for that. Keeping them apart means a family can set a
-- nice portrait for the avatar without disturbing the invitation artwork, and
-- either can be empty.
--
-- Nothing is required: until she uploads one, the pages draw a cartoon.
--
-- Safe to re-run.
alter table public.invitations add column if not exists profile_image_url text;

comment on column public.invitations.profile_image_url is
  'Square avatar for the hub and registration form. Null means show the cartoon default.';

-- Saving it is its own function rather than another parameter on
-- update_invitation_by_key, so the family editor and the hub cannot overwrite
-- each other's fields by omission — the editor posts every field it knows, and
-- it does not know about this one.
create or replace function public.set_invitation_profile_photo(p_slug text, p_key text, p_url text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select i.id into v_id
  from public.invitations i
  join public.invitation_edit_keys k on k.invitation_id = i.id
  where i.slug = p_slug
    and k.edit_key = p_key
    and i.status = 'active';

  if v_id is null then
    return false;
  end if;

  update public.invitations
     set profile_image_url = nullif(trim(p_url), ''),   -- '' clears it
         updated_at = now()
   where id = v_id;

  return true;
end;
$$;

revoke all on function public.set_invitation_profile_photo(text, text, text) from public;
grant execute on function public.set_invitation_profile_photo(text, text, text) to anon, authenticated;
