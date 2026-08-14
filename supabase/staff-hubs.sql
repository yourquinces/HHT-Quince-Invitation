-- Staff directory of quinceañera links. Run after quince-registration-staff.sql.
-- Safe to re-run.
--
-- Returns every active invitation together with its edit key, so staff can hand
-- a girl the one private link that unlocks her hub, her editor and everything
-- else. invitation_edit_keys is authenticated-only, which is why this has to go
-- through a security-definer function rather than a plain select.
--
-- Same STAFF_KEY as list_quince_registrations. Change both together if you
-- rotate it.

create or replace function public.list_invitation_links(p_key text)
returns table (
  slug             text,
  quinceanera_name text,
  preferred_name   text,
  ship             text,
  sailing_dates    text,
  sail_date        text,   -- cast below: the column is a date
  edit_key         text,
  registered       boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
begin
  if p_key is null or length(p_key) <> length(STAFF_KEY) or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  return query
    select i.slug,
           i.quinceanera_name,
           i.preferred_name,
           i.ship,
           i.sailing_dates,
           i.sail_date::text,
           k.edit_key,
           exists (
             select 1 from public.quince_registrations r
             where r.invitation_slug = i.slug
           ) as registered
    from public.invitations i
    left join public.invitation_edit_keys k on k.invitation_id = i.id
    where i.status = 'active'
    order by i.sail_date nulls last, i.quinceanera_name;
end;
$$;

revoke all on function public.list_invitation_links(text) from public;
grant execute on function public.list_invitation_links(text) to anon, authenticated;
