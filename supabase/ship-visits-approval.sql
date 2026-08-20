-- Ship visits: nothing reaches a cabin until an agent approves it.
--
-- Registering is a request, not a booking. A family fills the form, is sent to
-- the payment page, and may never arrive there — so a registration that
-- charged the quinceañera's cabin on submission was putting money on her
-- balance for people who had paid nothing. An agent now confirms the payment
-- first, exactly as the Cozumel excursion works.
--
-- What the gate does and does not hold back:
--   · The CHARGE waits for approval. Only approved parties are summed.
--   · The CABIN LINK does not — it is resolved on the way in as before, so the
--     agent can see whose cabin a request will hit before deciding.
--   · CAPACITY does not. A pending party is holding a place on the tour; the
--     alternative is overselling a 48-seat visit to everyone who never paid.
--     Rejecting gives the place back.
--
-- This file also carries the complete submit_ship_visit, including the
-- minor-email rule, so it supersedes ship-visits-minor-email.sql. Run this
-- one and that file becomes unnecessary.
--
-- Pure DDL — no function is called here. Safe to re-run.

-- ---------------------------------------------------------------------------
-- The gate
-- ---------------------------------------------------------------------------
-- Everything already in the table becomes pending, including anything that was
-- already charged. That is deliberate: those charges were posted before there
-- was anything to check them against.
alter table public.ship_visit_registrations
  add column if not exists status         text not null default 'pending',
  add column if not exists approved_at    timestamptz,
  add column if not exists approved_by    text,
  add column if not exists rejection_note text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'svr_status_check') then
    alter table public.ship_visit_registrations
      add constraint svr_status_check check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

comment on column public.ship_visit_registrations.status is
  'pending until an agent confirms payment. Only approved parties are charged to a cabin.';

create index if not exists ship_visit_reg_status_idx
  on public.ship_visit_registrations (status);

-- ---------------------------------------------------------------------------
-- Only approved money lands
-- ---------------------------------------------------------------------------
create or replace function public.recompute_ship_visit_charge(p_reservation_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.reservations r
     set ship_visit_charge = coalesce((
           select sum(reg.party_size * coalesce(v.price_per_person, 0))
             from public.ship_visit_registrations reg
             left join public.ship_visits v on v.id = reg.visit_id
            where reg.reservation_id = r.id
              and reg.status = 'approved'), 0)
   where r.id = p_reservation_id;
$$;

-- ---------------------------------------------------------------------------
-- Capacity ignores rejected parties only
-- ---------------------------------------------------------------------------
create or replace function public.list_ship_visits()
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(json_agg(v order by v.visit_date), '[]'::json)
  from (
    select s.id, s.visit_date, s.visit_time, s.ship, s.capacity, s.price_per_person,
           coalesce((select sum(r.party_size) from public.ship_visit_registrations r
                      where r.visit_id = s.id and r.status <> 'rejected'), 0) as booked,
           greatest(s.capacity - coalesce((select sum(r.party_size)
                      from public.ship_visit_registrations r
                      where r.visit_id = s.id and r.status <> 'rejected'), 0), 0) as remaining
    from public.ship_visits s
    where s.active
      and s.visit_date >= current_date
  ) v;
$$;

revoke all on function public.list_ship_visits() from public;
grant execute on function public.list_ship_visits() to anon, authenticated;

create or replace function public.list_ship_visit_registrations(p_key text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
  v_out json;
begin
  if p_key is null or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  select json_build_object(
    'visits', coalesce((
      select json_agg(json_build_object(
               'id', s.id, 'visit_date', s.visit_date, 'visit_time', s.visit_time,
               'ship', s.ship, 'capacity', s.capacity, 'active', s.active, 'notes', s.notes,
               'price_per_person', s.price_per_person,
               'booked', coalesce((select sum(r.party_size) from public.ship_visit_registrations r
                                    where r.visit_id = s.id and r.status <> 'rejected'), 0)
             ) order by s.visit_date desc)
      from public.ship_visits s
    ), '[]'::json),
    'registrations', coalesce((
      select json_agg(to_jsonb(r) order by r.created_at desc)
      from public.ship_visit_registrations r
    ), '[]'::json)
  ) into v_out;

  return v_out;
end;
$$;

revoke all on function public.list_ship_visit_registrations(text) from public;
grant execute on function public.list_ship_visit_registrations(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- The submit-time capacity check has to agree with the numbers above
-- ---------------------------------------------------------------------------
create or replace function public.svis_booked_on(p_visit_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(party_size), 0)::integer
    from public.ship_visit_registrations
   where visit_id = p_visit_id and status <> 'rejected';
$$;

-- ---------------------------------------------------------------------------
-- Submitting: the email rule, and a capacity check that agrees with the above
-- ---------------------------------------------------------------------------
-- This is the complete, final submit_ship_visit — it carries the minor-email
-- rule from ship-visits-minor-email.sql as well as the status-aware capacity
-- count, so this file supersedes that one. Running it after that file, or
-- instead of it, both end in the same place.

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
  to_regprocedure('public.svis_booked_on(uuid)') is not null as fn_booked_on,
  to_regprocedure('public.svis_is_adult(date,date)') is not null as fn_is_adult,
  (select count(*) from public.ship_visit_registrations where status = 'pending')  as now_pending,
  (select coalesce(sum(ship_visit_charge), 0) from public.reservations)             as charged_before_recompute;
