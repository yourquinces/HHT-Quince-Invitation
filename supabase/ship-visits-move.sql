-- Ship visits: move a whole family to a different date.
--
-- WHY THIS EXISTS
-- A booking was stuck on the date it was made for. Families call to switch —
-- somebody works that Saturday, a flight moves — and the only way to honour it
-- was to remove every person and have them register again on the new date.
-- That loses the row (so the pass code changes), re-runs the email rule
-- against a form the agent is typing on the family's behalf, and briefly
-- double-counts the capacity while both versions exist.
--
-- THIS MOVES THE ROW. Same id, same pass code, same cabin link, same people.
-- Only visit_id changes.
--
-- THE MONEY LOOKS AFTER ITSELF
-- ship_visit_charge_sync_trg fires AFTER UPDATE on this table and
-- recompute_ship_visit_charge re-reads the price through the visit join, so a
-- move to a date with a different price_per_person re-bills the cabin at the
-- new rate on its own. Do not touch reservations here — see the note in
-- ship-visits-delete-person.sql about two writers on that number.
--
-- WHAT IS CHECKED, AND WHY IT IS THE SAME LIST AS SUBMITTING
-- A move is a registration arriving on a date, so it has to pass what a new
-- registration would pass on that date:
--   · CAPACITY — the party's whole headcount has to fit in what is left,
--     counting pending parties (they hold a place) and ignoring rejected ones,
--     exactly as svis_booked_on does. A rejected party holds no place, so it
--     moves without a capacity check at all.
--   · ONE EMAIL PER ADULT ON THE DATE — the destination may already have one
--     of these addresses on it. Adulthood is judged at the DESTINATION's
--     visit date, because that is the day these people board.
--
-- WHAT IS DELIBERATELY NOT CHECKED
--   · `active`. Closing a date stops FAMILIES picking it on the form; it was
--     never meant to stop an agent placing someone there. The office closes a
--     date and then still has to move the stragglers onto it.
--   · Whether the date is in the past. Correcting last month's roster is a
--     real job, and refusing it would leave no way to do it.
--
-- LOCKING
-- The destination visit is locked, then the registration, in that order — the
-- same order submit_ship_visit takes (visit first). Two agents moving
-- families in opposite directions between two dates lock different visits and
-- so cannot deadlock; each simply counts the other's row as still present,
-- which is the safe direction to be wrong in.

create or replace function public.move_ship_visit_registration(
  p_key text, p_id uuid, p_visit_id uuid
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
  v_visit  record;
  v_reg    record;
  v_booked integer;
  v_emails text[];
  v_dupe   text;
begin
  if p_key is null or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  select * into v_visit from public.ship_visits
   where id = p_visit_id
   for update;                                  -- serialise against sign-ups
  if v_visit.id is null then
    return json_build_object('ok', false, 'error', 'That visit date no longer exists.');
  end if;

  select * into v_reg from public.ship_visit_registrations
   where id = p_id
   for update;
  if v_reg.id is null then
    return json_build_object('ok', false, 'error', 'That registration no longer exists.');
  end if;

  if v_reg.visit_id = v_visit.id then
    return json_build_object('ok', true, 'moved', false,
      'visit_id', v_visit.id, 'visit_date', v_visit.visit_date);
  end if;

  -- ── Room on the new date ────────────────────────────────────────────────
  -- Skipped for a rejected party: it is not holding a place on its old date
  -- and will not hold one here either.
  if v_reg.status is distinct from 'rejected' then
    select coalesce(sum(party_size), 0) into v_booked
      from public.ship_visit_registrations
     where visit_id = v_visit.id and status <> 'rejected';

    if v_booked + v_reg.party_size > v_visit.capacity then
      return json_build_object('ok', false,
        'error', format(
          'That date has %s %s left and this booking is %s %s.',
          greatest(v_visit.capacity - v_booked, 0),
          case when greatest(v_visit.capacity - v_booked, 0) = 1 then 'spot' else 'spots' end,
          v_reg.party_size,
          case when v_reg.party_size = 1 then 'person' else 'people' end),
        'remaining', greatest(v_visit.capacity - v_booked, 0));
    end if;
  end if;

  -- ── One address per adult, judged on the new date ───────────────────────
  -- A guest who is 17 on the old date and 18 on the new one starts needing an
  -- address of their own, which is why this is re-run rather than assumed to
  -- have passed already.
  select array_agg(e) into v_emails from (
    select lower(trim(x.email)) as e
      from (values
        (case when v_reg.registering_quince then v_reg.quince_email end, v_reg.quince_dob),
        (v_reg.guest1_email, v_reg.guest1_dob),
        (v_reg.guest2_email, v_reg.guest2_dob)
      ) as x(email, dob)
     where coalesce(trim(x.email), '') <> ''
       and public.svis_is_adult(x.dob, v_visit.visit_date)
  ) s;

  if v_emails is not null then
    select lower(trim(v.e)) into v_dupe
    from public.ship_visit_registrations r
    cross join lateral (values
      (r.quince_email, r.quince_dob),
      (r.guest1_email, r.guest1_dob),
      (r.guest2_email, r.guest2_dob)
    ) as v(e, d)
    where r.visit_id = v_visit.id
      and r.id <> v_reg.id
      and coalesce(trim(v.e), '') <> ''
      and public.svis_is_adult(v.d, v_visit.visit_date)
      and lower(trim(v.e)) = any(v_emails)
    limit 1;

    if v_dupe is not null then
      return json_build_object('ok', false,
        'error', format('%s is already registered on that date. Each adult needs their own email address — a minor may use their guardian''s, but two adults cannot share one.', v_dupe));
    end if;
  end if;

  update public.ship_visit_registrations
     set visit_id = v_visit.id
   where id = v_reg.id;

  return json_build_object(
    'ok', true, 'moved', true,
    'visit_id', v_visit.id,
    'visit_date', v_visit.visit_date,
    'party_size', v_reg.party_size);
end;
$$;

revoke all on function public.move_ship_visit_registration(text, uuid, uuid) from public;
grant execute on function public.move_ship_visit_registration(text, uuid, uuid) to anon, authenticated;

-- Confirm the install. Nothing here calls the function — a migration that
-- creates a plpgsql function and runs it can roll back its own CREATE when the
-- body throws, since bodies are only syntax-checked at creation time.
select to_regprocedure('public.move_ship_visit_registration(text,uuid,uuid)') is not null as fn_installed;
