-- Staff read access for the Quinceañera Registration Form.
-- Run AFTER quince-registration.sql. Safe to re-run.
--
-- The staff page is a static site with no login, so it proves itself with a
-- shared key checked inside this function. The key never leaves the URL the
-- staff member pastes; anon still cannot read the table directly.
--
-- To rotate: change STAFF_KEY below, re-run this file, and hand out the new
-- link. Old links stop working immediately.

create or replace function public.list_quince_registrations(p_key text)
returns setof public.quince_registrations
language plpgsql
security definer
set search_path = public
as $$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
begin
  -- Length check first so a wrong key cannot be probed by response timing.
  if p_key is null or length(p_key) <> length(STAFF_KEY) or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  return query
    select * from public.quince_registrations
    order by created_at desc;
end;
$$;

revoke all on function public.list_quince_registrations(text) from public;
grant execute on function public.list_quince_registrations(text) to anon, authenticated;
