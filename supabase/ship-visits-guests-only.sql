-- Ship visits, second pass: registering extra guests for a quinceañera who is
-- already booked on the visit, and one email per person.
--
-- Two things came out of using the first version:
--
--   1. Families come back to add relatives after the quinceañera is already
--      registered. Re-entering her details was busywork, and worse, it counted
--      her against the capacity a second time — the tour looked fuller than it
--      was. So a registration now says whether she is attending on THIS form,
--      and the party is counted accordingly.
--
--   2. One email address was being used for a whole family, which makes it
--      impossible to tell people apart or contact the right one. Every person
--      on a visit now needs their own.
--
-- Safe to re-run.

-- False when the quinceañera is already registered and this form is only
-- adding guests. Her name is still stored, as the reference for whose group
-- these guests belong to.
alter table public.ship_visit_registrations
  add column if not exists registering_quince boolean not null default true;

comment on column public.ship_visit_registrations.registering_quince is
  'False when the quinceañera was registered separately; she is not counted in party_size here.';

create or replace function public.submit_ship_visit(p_data jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_visit    record;
  v_size     integer;
  v_booked   integer;
  v_id       uuid;
  v_with_q   boolean;
  v_has_g1   boolean;
  v_has_g2   boolean;
  v_emails   text[];
  v_dupe     text;
begin
  select * into v_visit from public.ship_visits
   where id = (p_data->>'visit_id')::uuid and active
   for update;                                    -- serialise concurrent sign-ups

  if v_visit.id is null then
    return json_build_object('ok', false, 'error', 'That ship visit is no longer available.');
  end if;

  -- Defaults to true so anything still posting the old payload keeps working.
  v_with_q := coalesce((p_data->>'registering_quince')::boolean, true);
  v_has_g1 := coalesce(trim(p_data->>'guest1_first'), '') <> '';
  v_has_g2 := coalesce(trim(p_data->>'guest2_first'), '') <> '';

  if not v_with_q and not v_has_g1 and not v_has_g2 then
    return json_build_object('ok', false,
      'error', 'Add at least one guest, or tick that the quinceañera is attending.');
  end if;

  -- She only takes a place when she is attending on this form.
  v_size := (case when v_with_q then 1 else 0 end)
          + (case when v_has_g1 then 1 else 0 end)
          + (case when v_has_g2 then 1 else 0 end);

  -- ── One email per person ────────────────────────────────────────────────
  -- Gathered from whoever is actually on this form, lowercased, blanks out.
  select array_agg(e) into v_emails from (
    select lower(trim(x)) as e from unnest(array[
      case when v_with_q then p_data->>'quince_email' end,
      case when v_has_g1 then p_data->>'guest1_email' end,
      case when v_has_g2 then p_data->>'guest2_email' end
    ]) as x
    where coalesce(trim(x), '') <> ''
  ) s;

  if v_emails is not null then
    -- Same address twice on one form.
    select e into v_dupe from (
      select unnest(v_emails) as e
    ) t group by e having count(*) > 1 limit 1;
    if v_dupe is not null then
      return json_build_object('ok', false,
        'error', format('%s is entered twice. Each person needs their own email address.', v_dupe));
    end if;

    -- Already used by someone else on this same visit.
    select lower(trim(e)) into v_dupe
    from public.ship_visit_registrations r
    cross join lateral (values (r.quince_email), (r.guest1_email), (r.guest2_email)) as v(e)
    where r.visit_id = v_visit.id
      and coalesce(trim(e), '') <> ''
      and lower(trim(e)) = any(v_emails)
    limit 1;

    if v_dupe is not null then
      return json_build_object('ok', false,
        'error', format('%s is already registered for this ship visit. Each person needs their own email address — if you are adding more guests, use their own addresses.', v_dupe));
    end if;
  end if;

  select coalesce(sum(party_size), 0) into v_booked
    from public.ship_visit_registrations where visit_id = v_visit.id;

  if v_booked + v_size > v_visit.capacity then
    return json_build_object(
      'ok', false,
      'error', 'This ship visit is full. Please call the office and we will find you another date.',
      'remaining', greatest(v_visit.capacity - v_booked, 0));
  end if;

  insert into public.ship_visit_registrations (
    visit_id, registering_quince,
    quince_first, quince_last, quince_dob, quince_email, quince_id_type, quince_id_number,
    sail_date, cell_phone,
    guest1_first, guest1_last, guest1_dob, guest1_email, guest1_id_type, guest1_id_number,
    guest2_first, guest2_last, guest2_dob, guest2_email, guest2_id_type, guest2_id_number,
    agent, notes, party_size
  ) values (
    v_visit.id, v_with_q,
    nullif(trim(p_data->>'quince_first'), ''), nullif(trim(p_data->>'quince_last'), ''),
    case when v_with_q then nullif(p_data->>'quince_dob', '')::date end,
    case when v_with_q then nullif(trim(p_data->>'quince_email'), '') end,
    case when v_with_q then nullif(trim(p_data->>'quince_id_type'), '') end,
    case when v_with_q then nullif(trim(p_data->>'quince_id_number'), '') end,
    nullif(trim(p_data->>'sail_date'), ''), nullif(trim(p_data->>'cell_phone'), ''),
    nullif(trim(p_data->>'guest1_first'), ''), nullif(trim(p_data->>'guest1_last'), ''),
    nullif(p_data->>'guest1_dob', '')::date,
    nullif(trim(p_data->>'guest1_email'), ''), nullif(trim(p_data->>'guest1_id_type'), ''),
    nullif(trim(p_data->>'guest1_id_number'), ''),
    nullif(trim(p_data->>'guest2_first'), ''), nullif(trim(p_data->>'guest2_last'), ''),
    nullif(p_data->>'guest2_dob', '')::date,
    nullif(trim(p_data->>'guest2_email'), ''), nullif(trim(p_data->>'guest2_id_type'), ''),
    nullif(trim(p_data->>'guest2_id_number'), ''),
    nullif(trim(p_data->>'agent'), ''), nullif(trim(p_data->>'notes'), ''),
    v_size
  )
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id, 'party_size', v_size);
end;
$$;

revoke all on function public.submit_ship_visit(jsonb) from public;
grant execute on function public.submit_ship_visit(jsonb) to anon, authenticated;
