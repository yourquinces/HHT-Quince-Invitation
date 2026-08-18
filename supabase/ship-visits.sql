-- Ship Visit registration — replaces the 123ContactForm.
--
-- Two tables:
--   ship_visits               the dates the office opens for tours, with a
--                             capacity each. Staff manage these.
--   ship_visit_registrations  who is coming to one. Filled in from the form.
--
-- Trust model, same as the rest of this site: the form runs as `anon` and
-- these rows hold minors' dates of birth and ID numbers, so there is NO public
-- read on either table. anon gets EXECUTE on exactly two functions — one that
-- lists visits with a spot count and no personal data, and one that registers
-- a party. Everything staff-facing is behind the shared staff key.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- The visits
-- ---------------------------------------------------------------------------
create table if not exists public.ship_visits (
  id         uuid primary key default gen_random_uuid(),
  visit_date date not null,
  visit_time text,                       -- free text: "10:00 AM", "morning"
  ship       text,
  capacity   integer not null default 50 check (capacity >= 0),
  notes      text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ship_visits_date_idx on public.ship_visits (visit_date);

alter table public.ship_visits enable row level security;

-- No policies for anon: everything public goes through the functions below.
drop policy if exists "staff manage ship visits" on public.ship_visits;
create policy "staff manage ship visits"
  on public.ship_visits for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- The registrations
-- ---------------------------------------------------------------------------
-- One row per party: the quinceañera plus one or two guests. Kept flat rather
-- than a people table because the form is fixed at three and a flat row is
-- what the Google Sheet and the office's eyes both want.
create table if not exists public.ship_visit_registrations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  visit_id    uuid references public.ship_visits(id) on delete set null,

  quince_first     text,
  quince_last      text,
  quince_dob       date,
  quince_email     text,
  quince_id_type   text,
  quince_id_number text,

  sail_date   text,                      -- as written, e.g. "7/10/27 ALLURE"
  cell_phone  text,

  guest1_first     text,
  guest1_last      text,
  guest1_dob       date,
  guest1_email     text,
  guest1_id_type   text,
  guest1_id_number text,

  guest2_first     text,
  guest2_last      text,
  guest2_dob       date,
  guest2_email     text,
  guest2_id_type   text,
  guest2_id_number text,

  agent       text,
  notes       text,
  -- Quinceañera + guest 1 + guest 2 when present. Stored rather than derived
  -- so the capacity check and the headcount agree with each other forever.
  party_size  integer not null default 1
);

create index if not exists ship_visit_reg_visit_idx on public.ship_visit_registrations (visit_id);

alter table public.ship_visit_registrations enable row level security;

drop policy if exists "staff manage ship visit registrations" on public.ship_visit_registrations;
create policy "staff manage ship visit registrations"
  on public.ship_visit_registrations for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Public: what the form needs
-- ---------------------------------------------------------------------------
-- Upcoming visits with how many spots are left. Deliberately returns no
-- personal data — a stranger can learn that a tour exists and whether it is
-- full, which is all the form has to show.
create or replace function public.list_ship_visits()
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(json_agg(v order by v.visit_date), '[]'::json)
  from (
    select s.id, s.visit_date, s.visit_time, s.ship, s.capacity,
           coalesce((select sum(r.party_size) from public.ship_visit_registrations r
                      where r.visit_id = s.id), 0) as booked,
           greatest(s.capacity - coalesce((select sum(r.party_size)
                      from public.ship_visit_registrations r
                      where r.visit_id = s.id), 0), 0) as remaining
    from public.ship_visits s
    where s.active
      and s.visit_date >= current_date
  ) v;
$$;

revoke all on function public.list_ship_visits() from public;
grant execute on function public.list_ship_visits() to anon, authenticated;

-- Register a party. Returns {ok, error} rather than raising, so the form can
-- say something useful. The capacity check happens here, inside the same
-- statement that inserts, so two families submitting at once cannot both take
-- the last two spots.
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
begin
  select * into v_visit from public.ship_visits
   where id = (p_data->>'visit_id')::uuid and active
   for update;                                    -- serialise concurrent sign-ups

  if v_visit.id is null then
    return json_build_object('ok', false, 'error', 'That ship visit is no longer available.');
  end if;

  v_size := 1
          + (case when coalesce(trim(p_data->>'guest1_first'), '') <> '' then 1 else 0 end)
          + (case when coalesce(trim(p_data->>'guest2_first'), '') <> '' then 1 else 0 end);

  select coalesce(sum(party_size), 0) into v_booked
    from public.ship_visit_registrations where visit_id = v_visit.id;

  if v_booked + v_size > v_visit.capacity then
    return json_build_object(
      'ok', false,
      'error', 'This ship visit is full. Please call the office and we will find you another date.',
      'remaining', greatest(v_visit.capacity - v_booked, 0));
  end if;

  insert into public.ship_visit_registrations (
    visit_id,
    quince_first, quince_last, quince_dob, quince_email, quince_id_type, quince_id_number,
    sail_date, cell_phone,
    guest1_first, guest1_last, guest1_dob, guest1_email, guest1_id_type, guest1_id_number,
    guest2_first, guest2_last, guest2_dob, guest2_email, guest2_id_type, guest2_id_number,
    agent, notes, party_size
  ) values (
    v_visit.id,
    nullif(trim(p_data->>'quince_first'), ''), nullif(trim(p_data->>'quince_last'), ''),
    nullif(p_data->>'quince_dob', '')::date,
    nullif(trim(p_data->>'quince_email'), ''), nullif(trim(p_data->>'quince_id_type'), ''),
    nullif(trim(p_data->>'quince_id_number'), ''),
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

-- ---------------------------------------------------------------------------
-- Staff: the monitor, behind the same shared key as the other staff views
-- ---------------------------------------------------------------------------
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
               'booked', coalesce((select sum(r.party_size) from public.ship_visit_registrations r
                                    where r.visit_id = s.id), 0)
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

-- Create or update a visit date. Same key. Passing p_id updates in place.
create or replace function public.save_ship_visit(
  p_key text, p_id uuid, p_visit_date date, p_visit_time text,
  p_ship text, p_capacity integer, p_active boolean, p_notes text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
  v_id uuid;
begin
  if p_key is null or p_key <> STAFF_KEY then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  if p_visit_date is null then
    return json_build_object('ok', false, 'error', 'A visit needs a date.');
  end if;

  if p_id is null then
    insert into public.ship_visits (visit_date, visit_time, ship, capacity, active, notes)
    values (p_visit_date, nullif(trim(p_visit_time), ''), nullif(trim(p_ship), ''),
            greatest(coalesce(p_capacity, 50), 0), coalesce(p_active, true), nullif(trim(p_notes), ''))
    returning id into v_id;
  else
    update public.ship_visits set
      visit_date = p_visit_date,
      visit_time = nullif(trim(p_visit_time), ''),
      ship       = nullif(trim(p_ship), ''),
      capacity   = greatest(coalesce(p_capacity, 50), 0),
      active     = coalesce(p_active, true),
      notes      = nullif(trim(p_notes), '')
    where id = p_id
    returning id into v_id;
  end if;

  return json_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.save_ship_visit(text, uuid, date, text, text, integer, boolean, text) from public;
grant execute on function public.save_ship_visit(text, uuid, date, text, text, integer, boolean, text) to anon, authenticated;
