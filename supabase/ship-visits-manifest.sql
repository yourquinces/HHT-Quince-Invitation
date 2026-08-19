-- Ship visits, third pass: the manifest Royal Caribbean actually asks for,
-- and knowing who on a tour is not booked yet.
--
-- Two things this adds:
--
--   1. Citizenship, per person. The port manifest has a citizenship column and
--      it is not always USA. Families are NOT asked — the answer is USA for
--      almost everyone and one more required field on a public form costs more
--      than it earns. The column is left null, exported as USA, and staff set
--      the handful that are not from the Ship Visits page.
--
--   2. A link from each attendee to their QRS passenger row. A ship visit is
--      sold before the cabin exists — people tour the ship precisely to decide
--      whether to book — so a registration cannot require a reservation. This
--      records the link when it is eventually made, and stays null until then,
--      which is exactly how QRS tells "booked" from "not booked yet".
--
-- Reason for boarding and company are deliberately NOT columns: they are the
-- same two strings on every row we will ever send, so they belong in the
-- export, not in storage.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Citizenship — null means USA
-- ---------------------------------------------------------------------------
alter table public.ship_visit_registrations
  add column if not exists quince_citizenship text,
  add column if not exists guest1_citizenship text,
  add column if not exists guest2_citizenship text;

comment on column public.ship_visit_registrations.quince_citizenship is
  'Three-letter country code for the port manifest. Null means USA — not asked on the form, set by staff for the exceptions.';

-- ---------------------------------------------------------------------------
-- Link to QRS — null means "not booked yet"
-- ---------------------------------------------------------------------------
alter table public.ship_visit_registrations
  add column if not exists quince_passenger_id uuid,
  add column if not exists guest1_passenger_id uuid,
  add column if not exists guest2_passenger_id uuid;

comment on column public.ship_visit_registrations.quince_passenger_id is
  'The QRS passengers row this attendee turned out to be, once they book. Null until then; that null IS the "not booked yet" state.';

-- The foreign keys are added separately and defensively. They are worth having
-- — a deleted passenger leaving a dangling id would show a cancelled family as
-- still booked forever — but this file must not fail on a database where the
-- QRS tables are not present.
do $$
begin
  if to_regclass('public.passengers') is not null then
    if not exists (select 1 from pg_constraint where conname = 'svr_quince_passenger_fk') then
      alter table public.ship_visit_registrations
        add constraint svr_quince_passenger_fk foreign key (quince_passenger_id)
        references public.passengers(id) on delete set null;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'svr_guest1_passenger_fk') then
      alter table public.ship_visit_registrations
        add constraint svr_guest1_passenger_fk foreign key (guest1_passenger_id)
        references public.passengers(id) on delete set null;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'svr_guest2_passenger_fk') then
      alter table public.ship_visit_registrations
        add constraint svr_guest2_passenger_fk foreign key (guest2_passenger_id)
        references public.passengers(id) on delete set null;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Staff: set one person's citizenship
-- ---------------------------------------------------------------------------
-- The staff page runs as anon behind the shared key, exactly like the rest of
-- the /staff views, so the write goes through a function rather than the table.
-- p_who is 'quince', 'guest1' or 'guest2' — whitelisted here rather than
-- interpolated, so the column name can never come from the caller.
create or replace function public.set_ship_visit_citizenship(
  p_key text, p_id uuid, p_who text, p_citizenship text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
  v_val text;
begin
  if p_key is null or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  -- Blank clears it back to the USA default rather than storing an empty
  -- string, so "unset" has exactly one representation.
  v_val := nullif(upper(trim(coalesce(p_citizenship, ''))), '');

  if p_who = 'quince' then
    update public.ship_visit_registrations set quince_citizenship = v_val where id = p_id;
  elsif p_who = 'guest1' then
    update public.ship_visit_registrations set guest1_citizenship = v_val where id = p_id;
  elsif p_who = 'guest2' then
    update public.ship_visit_registrations set guest2_citizenship = v_val where id = p_id;
  else
    return json_build_object('ok', false, 'error', format('Unknown person "%s".', p_who));
  end if;

  if not found then
    return json_build_object('ok', false, 'error', 'That registration no longer exists.');
  end if;

  return json_build_object('ok', true, 'citizenship', v_val);
end;
$$;

revoke all on function public.set_ship_visit_citizenship(text, uuid, text, text) from public;
grant execute on function public.set_ship_visit_citizenship(text, uuid, text, text) to anon, authenticated;
