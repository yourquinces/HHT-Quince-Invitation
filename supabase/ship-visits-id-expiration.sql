-- Ship visits: ID expiration date (2026-09-28).
--
-- One optional date per person, asked on the form as "ID Expiration Date
-- (if applicable)" — a school ID or birth certificate often has none, so it is
-- never required and null simply means "not given". Not part of the RCL
-- manifest export (their columns are fixed); it shows and edits in the staff
-- roster only.
--
-- Creates only, calls nothing — safe to run as one file.

alter table public.ship_visit_registrations
  add column if not exists quince_id_expiration date,
  add column if not exists guest1_id_expiration date,
  add column if not exists guest2_id_expiration date,
  add column if not exists guest3_id_expiration date;

CREATE OR REPLACE FUNCTION public.submit_ship_visit(p_data jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_visit    record;
  v_size     integer;
  v_booked   integer;
  v_id       uuid;
  v_with_q   boolean;
  v_has_g1   boolean;
  v_has_g2   boolean;
  v_has_g3   boolean;
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
  v_has_g3 := coalesce(trim(p_data->>'guest3_first'), '') <> '';

  if not v_with_q and not v_has_g1 and not v_has_g2 and not v_has_g3 then
    return json_build_object('ok', false,
      'error', 'Add at least one guest, or tick that the quinceañera is attending.');
  end if;

  -- She only takes a place when she is attending on this form.
  v_size := (case when v_with_q then 1 else 0 end)
          + (case when v_has_g1 then 1 else 0 end)
          + (case when v_has_g2 then 1 else 0 end)
          + (case when v_has_g3 then 1 else 0 end);

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
         case when v_has_g2 then nullif(p_data->>'guest2_dob', '')::date end),
        (case when v_has_g3 then p_data->>'guest3_email' end,
         case when v_has_g3 then nullif(p_data->>'guest3_dob', '')::date end)
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
      (r.guest2_email, r.guest2_dob),
      (r.guest3_email, r.guest3_dob)
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

  -- Rejected parties give their places back; pending ones keep holding theirs,
  -- or a 48-seat visit oversells to everyone who never paid.
  select coalesce(sum(party_size), 0) into v_booked
    from public.ship_visit_registrations
   where visit_id = v_visit.id and status <> 'rejected';

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
    guest3_first, guest3_last, guest3_dob, guest3_email, guest3_id_type, guest3_id_number,
    quince_id_expiration, guest1_id_expiration, guest2_id_expiration, guest3_id_expiration,
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
    nullif(trim(p_data->>'guest3_first'), ''), nullif(trim(p_data->>'guest3_last'), ''),
    nullif(p_data->>'guest3_dob', '')::date,
    nullif(trim(p_data->>'guest3_email'), ''), nullif(trim(p_data->>'guest3_id_type'), ''),
    nullif(trim(p_data->>'guest3_id_number'), ''),
    case when v_with_q then nullif(p_data->>'quince_id_expiration', '')::date end,
    case when v_has_g1 then nullif(p_data->>'guest1_id_expiration', '')::date end,
    case when v_has_g2 then nullif(p_data->>'guest2_id_expiration', '')::date end,
    case when v_has_g3 then nullif(p_data->>'guest3_id_expiration', '')::date end,
    nullif(trim(p_data->>'agent'), ''), nullif(trim(p_data->>'notes'), ''),
    v_size
  )
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id, 'party_size', v_size);
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_ship_visit_field(p_key text, p_id uuid, p_who text, p_field text, p_value text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
  PERSON_FIELDS constant text[] :=
    array['first', 'last', 'dob', 'email', 'id_type', 'id_number', 'id_expiration', 'citizenship'];
  PARTY_FIELDS  constant text[] := array['cell_phone', 'agent', 'sail_date', 'notes'];
  v_col   text;
  v_val   text;
  v_date  date;
  v_rows  integer;
begin
  if p_key is null or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  v_val := nullif(trim(coalesce(p_value, '')), '');

  if p_who = 'party' then
    if not (p_field = any (PARTY_FIELDS)) then
      return json_build_object('ok', false, 'error', format('Field "%s" is not editable.', p_field));
    end if;
    v_col := p_field;
  elsif p_who in ('quince', 'guest1', 'guest2', 'guest3') then
    if not (p_field = any (PERSON_FIELDS)) then
      return json_build_object('ok', false, 'error', format('Field "%s" is not editable.', p_field));
    end if;
    v_col := p_who || '_' || p_field;
  else
    return json_build_object('ok', false, 'error', format('Unknown person "%s".', p_who));
  end if;

  -- A date column will not take free text, and an agent who fat-fingers one
  -- should be told rather than shown a Postgres error in an alert box.
  if p_field in ('dob', 'id_expiration') then
    if v_val is null then
      v_date := null;
    else
      begin
        v_date := v_val::date;
      exception when others then
        return json_build_object('ok', false, 'error', case when p_field = 'dob' then 'That date of birth is not a real date.' else 'That expiration date is not a real date.' end);
      end;
    end if;
    execute format('update public.ship_visit_registrations set %I = $1 where id = $2', v_col)
      using v_date, p_id;
    get diagnostics v_rows = row_count;
  else
    -- Names and citizenship go up so the manifest reads consistently; emails
    -- go down so they stay comparable. ID numbers are left exactly as typed —
    -- some carry meaningful case and none of them are ours to normalise.
    if p_field in ('first', 'last', 'citizenship') then
      v_val := upper(v_val);
    elsif p_field = 'email' then
      v_val := lower(v_val);
    end if;
    execute format('update public.ship_visit_registrations set %I = $1 where id = $2', v_col)
      using v_val, p_id;
    get diagnostics v_rows = row_count;
  end if;

  -- EXECUTE does not set FOUND, so the row count has to be asked for. Reading
  -- FOUND here reported "no such registration" on every successful edit — and
  -- returned before the headcount below could be recomputed.
  if v_rows = 0 then
    return json_build_object('ok', false, 'error', 'That registration no longer exists.');
  end if;

  -- Clearing a name removes a person, and the headcount has to follow or the
  -- visit keeps holding a seat for somebody who is no longer listed.
  update public.ship_visit_registrations set party_size = greatest(1,
      (case when registering_quince and coalesce(quince_first, quince_last) is not null then 1 else 0 end)
    + (case when coalesce(guest1_first, guest1_last) is not null then 1 else 0 end)
    + (case when coalesce(guest2_first, guest2_last) is not null then 1 else 0 end)
    + (case when coalesce(guest3_first, guest3_last) is not null then 1 else 0 end))
  where id = p_id;

  return json_build_object('ok', true, 'value', case when p_field in ('dob', 'id_expiration') then v_date::text else v_val end);
end;
$function$;

CREATE OR REPLACE FUNCTION public.delete_ship_visit_person(p_key text, p_id uuid, p_who text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
  v_name      text;
  v_remaining integer;
begin
  if p_key is null or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  -- Locked for the whole operation: the clear, the re-count and the possible
  -- delete have to be one decision, or two agents removing different guests
  -- at the same moment can both read a stale count.
  perform 1 from public.ship_visit_registrations where id = p_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'That registration no longer exists.');
  end if;

  if p_who = 'quince' then
    select nullif(trim(coalesce(quince_first, '') || ' ' || coalesce(quince_last, '')), '')
      into v_name from public.ship_visit_registrations where id = p_id;
    update public.ship_visit_registrations set
      quince_first = null, quince_last = null, quince_dob = null,
      quince_email = null, quince_id_type = null, quince_id_number = null,
      quince_citizenship = null, quince_id_expiration = null, registering_quince = false
    where id = p_id;

  elsif p_who = 'guest1' then
    select nullif(trim(coalesce(guest1_first, '') || ' ' || coalesce(guest1_last, '')), '')
      into v_name from public.ship_visit_registrations where id = p_id;
    update public.ship_visit_registrations set
      guest1_first = null, guest1_last = null, guest1_dob = null,
      guest1_email = null, guest1_id_type = null, guest1_id_number = null,
      guest1_citizenship = null, guest1_id_expiration = null
    where id = p_id;

  elsif p_who = 'guest2' then
    select nullif(trim(coalesce(guest2_first, '') || ' ' || coalesce(guest2_last, '')), '')
      into v_name from public.ship_visit_registrations where id = p_id;
    update public.ship_visit_registrations set
      guest2_first = null, guest2_last = null, guest2_dob = null,
      guest2_email = null, guest2_id_type = null, guest2_id_number = null,
      guest2_citizenship = null, guest2_id_expiration = null
    where id = p_id;

  elsif p_who = 'guest3' then
    select nullif(trim(coalesce(guest3_first, '') || ' ' || coalesce(guest3_last, '')), '')
      into v_name from public.ship_visit_registrations where id = p_id;
    update public.ship_visit_registrations set
      guest3_first = null, guest3_last = null, guest3_dob = null,
      guest3_email = null, guest3_id_type = null, guest3_id_number = null,
      guest3_citizenship = null, guest3_id_expiration = null
    where id = p_id;

  else
    return json_build_object('ok', false, 'error', format('Unknown person "%s".', p_who));
  end if;

  -- Who is genuinely left. Mirrors the rule the roster renders by: a person
  -- exists when they have a name, and the quinceañera additionally has to
  -- still be registering.
  select (case when registering_quince and coalesce(quince_first, quince_last) is not null then 1 else 0 end)
       + (case when coalesce(guest1_first, guest1_last) is not null then 1 else 0 end)
       + (case when coalesce(guest2_first, guest2_last) is not null then 1 else 0 end)
       + (case when coalesce(guest3_first, guest3_last) is not null then 1 else 0 end)
    into v_remaining
  from public.ship_visit_registrations where id = p_id;

  if v_remaining = 0 then
    delete from public.ship_visit_registrations where id = p_id;
    return json_build_object('ok', true, 'name', v_name, 'party_deleted', true, 'party_size', 0);
  end if;

  update public.ship_visit_registrations set party_size = v_remaining where id = p_id;
  return json_build_object('ok', true, 'name', v_name, 'party_deleted', false, 'party_size', v_remaining);
end;
$function$;
