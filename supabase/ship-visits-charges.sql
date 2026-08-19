-- Ship visits, fourth pass: $20 a head, billed to the quinceañera's cabin.
--
-- The model, in one line: a ship visit party belongs to a CABIN, not to a
-- passenger. Mo and Mia share a cabin; Mo, Jocelyn and Mia all tour the ship;
-- all three names and all three charges land on Mia's cabin — and Jocelyn
-- needs no passenger record anywhere, because nothing is keyed to one.
--
-- That is the whole difference from the Cozumel excursion, where every signup
-- is keyed to a passenger_id on a live cabin and somebody without a booking
-- has nothing to attach to. A ship visit is what people do BEFORE they book,
-- so keying it to a passenger would have been backwards.
--
-- Supersedes the passenger-level link added in ship-visits-manifest.sql
-- earlier today, which modelled the wrong thing.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Undo the wrong model
-- ---------------------------------------------------------------------------
-- These were added hours ago and hold at most a handful of agent clicks. The
-- link they recorded — "this attendee is that passenger" — is not what the
-- office needs; the cabin is.
alter table public.ship_visit_registrations
  drop column if exists quince_passenger_id,
  drop column if exists guest1_passenger_id,
  drop column if exists guest2_passenger_id;

-- ---------------------------------------------------------------------------
-- The price, per visit date
-- ---------------------------------------------------------------------------
-- $20 a head today. On the visit rather than hardcoded so a future date can
-- cost something else without a migration, and so an already-billed visit
-- keeps its own price when the rate changes.
alter table public.ship_visits
  add column if not exists price_per_person numeric(10,2) not null default 20;

-- ---------------------------------------------------------------------------
-- Which cabin this party bills to
-- ---------------------------------------------------------------------------
-- One per registration, not one per person: a registration is by construction
-- one quinceañera's party, and every one of them bills to her cabin. Null
-- until an agent confirms which cabin she is — nothing is auto-linked, because
-- two quinceañeras really do share a surname.
alter table public.ship_visit_registrations
  add column if not exists reservation_id uuid;

comment on column public.ship_visit_registrations.reservation_id is
  'The quinceañera cabin this whole party bills to. Null until an agent confirms it in QRS.';

do $$
begin
  if to_regclass('public.reservations') is not null
     and not exists (select 1 from pg_constraint where conname = 'svr_reservation_fk') then
    alter table public.ship_visit_registrations
      add constraint svr_reservation_fk foreign key (reservation_id)
      references public.reservations(id) on delete set null;
  end if;
end $$;

create index if not exists ship_visit_reg_reservation_idx
  on public.ship_visit_registrations (reservation_id);

-- ---------------------------------------------------------------------------
-- The charge on the cabin
-- ---------------------------------------------------------------------------
alter table public.reservations
  add column if not exists ship_visit_charge numeric(12,2) not null default 0;

comment on column public.reservations.ship_visit_charge is
  'Auto-computed from ship_visit_registrations — party_size x the visit price. Never edit by hand.';

-- party_size already excludes the quinceañera on a guests-only form, because
-- she was counted on the form that registered her. That is exactly what stops
-- her being billed the $20 twice.
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
            where reg.reservation_id = r.id), 0)
   where r.id = p_reservation_id;
$$;

-- A registration moving between cabins has to credit the old one as well as
-- charge the new, so both sides of an UPDATE are recomputed.
create or replace function public.ship_visit_charge_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP in ('UPDATE', 'DELETE') and OLD.reservation_id is not null then
    perform public.recompute_ship_visit_charge(OLD.reservation_id);
  end if;
  if TG_OP in ('INSERT', 'UPDATE') and NEW.reservation_id is not null then
    perform public.recompute_ship_visit_charge(NEW.reservation_id);
  end if;
  return null;
end;
$$;

drop trigger if exists ship_visit_charge_sync_trg on public.ship_visit_registrations;
create trigger ship_visit_charge_sync_trg
after insert or update or delete on public.ship_visit_registrations
for each row execute function public.ship_visit_charge_sync();

-- Changing a visit's price re-bills every cabin on that visit, so the office
-- never has to touch the rows by hand.
create or replace function public.ship_visit_price_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if NEW.price_per_person is distinct from OLD.price_per_person then
    for v_id in
      select distinct reservation_id from public.ship_visit_registrations
       where visit_id = NEW.id and reservation_id is not null
    loop
      perform public.recompute_ship_visit_charge(v_id);
    end loop;
  end if;
  return null;
end;
$$;

drop trigger if exists ship_visit_price_sync_trg on public.ship_visits;
create trigger ship_visit_price_sync_trg
after update on public.ship_visits
for each row execute function public.ship_visit_price_sync();

-- ---------------------------------------------------------------------------
-- Staff: set the price when opening or editing a visit date
-- ---------------------------------------------------------------------------
-- The old 8-argument version is dropped rather than left alongside, so a call
-- can never resolve to the one that silently ignores the price.
drop function if exists public.save_ship_visit(text, uuid, date, text, text, integer, boolean, text);

create or replace function public.save_ship_visit(
  p_key text, p_id uuid, p_visit_date date, p_visit_time text,
  p_ship text, p_capacity integer, p_active boolean, p_notes text,
  p_price_per_person numeric default 20
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
    insert into public.ship_visits (visit_date, visit_time, ship, capacity, active, notes, price_per_person)
    values (p_visit_date, nullif(trim(p_visit_time), ''), nullif(trim(p_ship), ''),
            greatest(coalesce(p_capacity, 50), 0), coalesce(p_active, true),
            nullif(trim(p_notes), ''), greatest(coalesce(p_price_per_person, 20), 0))
    returning id into v_id;
  else
    update public.ship_visits set
      visit_date       = p_visit_date,
      visit_time       = nullif(trim(p_visit_time), ''),
      ship             = nullif(trim(p_ship), ''),
      capacity         = greatest(coalesce(p_capacity, 50), 0),
      active           = coalesce(p_active, true),
      notes            = nullif(trim(p_notes), ''),
      price_per_person = greatest(coalesce(p_price_per_person, 20), 0)
    where id = p_id
    returning id into v_id;
  end if;

  return json_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.save_ship_visit(text, uuid, date, text, text, integer, boolean, text, numeric) from public;
grant execute on function public.save_ship_visit(text, uuid, date, text, text, integer, boolean, text, numeric) to anon, authenticated;

-- The public list needs the price so the form can tell a family what the tour
-- costs before they fill it in.
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

-- Backfill anything already linked (no-op on a fresh install).
do $$
declare v_id uuid;
begin
  for v_id in select distinct reservation_id from public.ship_visit_registrations
               where reservation_id is not null
  loop
    perform public.recompute_ship_visit_charge(v_id);
  end loop;
end $$;
