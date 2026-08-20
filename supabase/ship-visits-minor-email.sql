-- Ship visits: minors share their guardian's email address.
--
-- The one-email-per-person rule was written to stop one address standing in
-- for a whole family, which made it impossible to tell people apart or contact
-- the right one. That reasoning only ever applied to adults. A fifteen-year-old
-- does not have her own address to give — hers IS her guardian's — and the
-- rule was rejecting exactly the submission we want.
--
-- So the rule is now: an ADULT's address must be theirs alone, on this form
-- and across the whole visit. A minor's is simply not checked, because it is
-- expected to be a duplicate of the adult standing next to her.
--
-- Deliberately NOT requiring a minor's address to match an adult on the same
-- form. Families come back to add relatives, so the guardian is often on an
-- earlier registration entirely, and demanding a match would reject that.
--
-- Pure DDL — no function is called here. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Adult on the day of the visit
-- ---------------------------------------------------------------------------
-- Age is taken at the visit date, not today: a guest who turns 18 between
-- registering and touring is an adult at the gangway, which is the moment the
-- port cares about. An unknown date of birth counts as an adult, so a missing
-- DOB can never be used to slip past the uniqueness check.
create or replace function public.svis_is_adult(p_dob date, p_on date)
returns boolean
language sql
immutable
as $$
  select case
           when p_dob is null or p_on is null then true
           else extract(year from age(p_on::timestamp, p_dob::timestamp)) >= 18
         end;
$$;

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

  -- ── One address per ADULT ───────────────────────────────────────────────
  -- Minors are left out of this entirely: theirs is their guardian's, and the
  -- quinceañera herself is nearly always one of them.
  select array_agg(e) into v_emails from (
    select lower(trim(x.email)) as e
      from (values
        (case when v_with_q then p_data->>'quince_email' end,
         case when v_with_q then nullif(p_data->>'quince_dob', '')::date end),
        (case when v_has_g1 then p_data->>'guest1_email' end,
         case when v_has_g1 then nullif(p_data->>'guest1_dob', '')::date end),
        (case when v_has_g2 then p_data->>'guest2_email' end,
         case when v_has_g2 then nullif(p_data->>'guest2_dob', '')::date end)
      ) as x(email, dob)
     where coalesce(trim(x.email), '') <> ''
       and public.svis_is_adult(x.dob, v_visit.visit_date)
  ) s;

  if v_emails is not null then
    -- Two adults on this form sharing one address.
    select e into v_dupe from (
      select unnest(v_emails) as e
    ) t group by e having count(*) > 1 limit 1;
    if v_dupe is not null then
      return json_build_object('ok', false,
        'error', format('%s is entered twice. Each adult needs their own email address — only a minor may share their guardian''s.', v_dupe));
    end if;

    -- Already used by another ADULT on this same visit. A minor already
    -- registered under this address is not a conflict; that is the guardian's
    -- own address and this may well be the guardian.
    select lower(trim(v.e)) into v_dupe
    from public.ship_visit_registrations r
    cross join lateral (values
      (r.quince_email, r.quince_dob),
      (r.guest1_email, r.guest1_dob),
      (r.guest2_email, r.guest2_dob)
    ) as v(e, d)
    where r.visit_id = v_visit.id
      and coalesce(trim(v.e), '') <> ''
      and public.svis_is_adult(v.d, v_visit.visit_date)
      and lower(trim(v.e)) = any(v_emails)
    limit 1;

    if v_dupe is not null then
      return json_build_object('ok', false,
        'error', format('%s is already registered for this ship visit. Each adult needs their own email address — a minor may use their guardian''s, but two adults cannot share one.', v_dupe));
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

-- Confirm the install.
select
  to_regprocedure('public.svis_is_adult(date,date)')   is not null as fn_is_adult,
  to_regprocedure('public.submit_ship_visit(jsonb)')   is not null as fn_submit;
