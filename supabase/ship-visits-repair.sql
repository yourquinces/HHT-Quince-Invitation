-- Ship visits repair, second attempt.
--
-- The first attempt failed on `min(r.id)` — Postgres has no min() aggregate
-- for uuid — which threw inside resolve_ship_visit_cabin and rolled the whole
-- batch back, so nothing at all was applied, including the price fix. The
-- resolver now collects candidates into an array instead, which gives both the
-- count and the single id without a cast.
--
-- Everything here is idempotent. Run as ONE batch; if it stops, send the error.

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

-- ─────────────────────────────────────────────────────────────────────

-- ---------------------------------------------------------------------------
-- Name normalising
-- ---------------------------------------------------------------------------
-- Families type "Jamie Darias"; the cabin might read "DARIAS, JAMIE" or
-- "Jamie Darías Pérez". Matching on both name parts appearing anywhere in the
-- cabin's name, accent- and case-folded, handles every one of those without
-- caring about order. Deliberately not the unaccent extension, which is not
-- guaranteed to be installed.
create or replace function public.svis_norm(t text)
returns text
language sql
immutable
as $$
  select translate(lower(coalesce(t, '')), 'áéíóúüñàèìòùâêîôûç', 'aeiouunaeiouaeiouc');
$$;

-- ---------------------------------------------------------------------------
-- Name -> cabin
-- ---------------------------------------------------------------------------
-- Returns her cabin, or null. Null covers both "no cabin under that name" and
-- "more than one" — a charge landing on a stranger's balance is far worse than
-- a party sitting on an exception list until somebody looks at it, so an
-- ambiguous name is never guessed.
create or replace function public.resolve_ship_visit_cabin(p_first text, p_last text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_first text := svis_norm(p_first);
  v_last  text := svis_norm(p_last);
  -- Collected as an array rather than count() + min(): there is no min()
  -- aggregate for uuid, and an array gives the count and the single id in one
  -- pass without a cast.
  v_ids   uuid[];
begin
  if v_first = '' or v_last = '' then return null; end if;

  -- Her own cabin: the reservation flagged as the one she is sailing in. A
  -- quinceañera group is many cabins all carrying her name, so this flag is
  -- what separates hers from her guests'.
  select array_agg(r.id) into v_ids
    from public.reservations r
   where r.is_quinceanera
     and upper(coalesce(r.status, '')) not in ('CX', 'CANCELLED', 'CANCEL')
     and svis_norm(r.quinceanera_name) like '%' || v_first || '%'
     and svis_norm(r.quinceanera_name) like '%' || v_last  || '%';

  if coalesce(array_length(v_ids, 1), 0) = 1 then return v_ids[1]; end if;
  if coalesce(array_length(v_ids, 1), 0) > 1 then return null; end if;  -- ambiguous: do not guess

  -- Nothing flagged. Some older groups never had the flag set, so fall back to
  -- any live cabin carrying her name — still only when there is exactly one.
  -- A whole group under her name stays ambiguous, which is correct: we cannot
  -- tell which of six cabins is hers.
  select array_agg(r.id) into v_ids
    from public.reservations r
   where upper(coalesce(r.status, '')) not in ('CX', 'CANCELLED', 'CANCEL')
     and svis_norm(r.quinceanera_name) like '%' || v_first || '%'
     and svis_norm(r.quinceanera_name) like '%' || v_last  || '%';

  if coalesce(array_length(v_ids, 1), 0) = 1 then return v_ids[1]; end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Attach on the way in
-- ---------------------------------------------------------------------------
-- Fires before the charge trigger, so a party that resolves is billed the
-- moment it is submitted with nobody touching it.
create or replace function public.ship_visit_autolink()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.reservation_id is null then
    NEW.reservation_id := public.resolve_ship_visit_cabin(NEW.quince_first, NEW.quince_last);
  end if;
  return NEW;
end;
$$;

drop trigger if exists ship_visit_autolink_trg on public.ship_visit_registrations;
create trigger ship_visit_autolink_trg
before insert on public.ship_visit_registrations
for each row execute function public.ship_visit_autolink();

-- ---------------------------------------------------------------------------
-- Catch up the ones that arrived before the cabin existed
-- ---------------------------------------------------------------------------
-- A family tours the ship and books afterwards, so most registrations are
-- entered before there is any cabin to attach them to. QRS calls this every
-- time the Ship Visits tab is opened; it only ever fills blanks, so a cabin an
-- agent set by hand is never overwritten.
create or replace function public.resolve_ship_visit_cabins()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     record;
  v_cabin   uuid;
  v_fixed   integer := 0;
  v_pending integer;
begin
  for v_row in
    select id, quince_first, quince_last
      from public.ship_visit_registrations
     where reservation_id is null
  loop
    v_cabin := public.resolve_ship_visit_cabin(v_row.quince_first, v_row.quince_last);
    if v_cabin is not null then
      update public.ship_visit_registrations
         set reservation_id = v_cabin
       where id = v_row.id;
      v_fixed := v_fixed + 1;
    end if;
  end loop;

  select count(*) into v_pending
    from public.ship_visit_registrations where reservation_id is null;

  return json_build_object('ok', true, 'linked', v_fixed, 'unresolved', v_pending);
end;
$$;

-- Supabase grants EXECUTE on new public functions to anon by default, and this
-- one both reads and writes booking data. Staff only.
revoke all on function public.resolve_ship_visit_cabins() from public, anon;
grant execute on function public.resolve_ship_visit_cabins() to authenticated;
revoke all on function public.resolve_ship_visit_cabin(text, text) from public, anon;
grant execute on function public.resolve_ship_visit_cabin(text, text) to authenticated;

-- Run it once now, so everything already registered is attached and billed.
select public.resolve_ship_visit_cabins();

-- ---------------------------------------------------------------------------
-- Report
-- ---------------------------------------------------------------------------
select
  to_regprocedure('public.svis_norm(text)')                     is not null as fn_norm,
  to_regprocedure('public.resolve_ship_visit_cabin(text,text)') is not null as fn_resolve_one,
  to_regprocedure('public.resolve_ship_visit_cabins()')         is not null as fn_catchup,
  to_regprocedure('public.recompute_ship_visit_charge(uuid)')   is not null as fn_recompute,
  (select count(*) from pg_trigger where tgname = 'ship_visit_autolink_trg')    as trg_autolink,
  (select count(*) from pg_trigger where tgname = 'ship_visit_charge_sync_trg') as trg_charge,
  (select price_per_person from public.ship_visits order by visit_date desc limit 1) as visit_price;

-- Every live cabin whose quinceañera name contains both parts, and which of
-- them is flagged as hers. More than one flagged means the resolver refuses to
-- guess, and that would be why nothing attached.
select r.cabin_number, r.booking_number, r.quinceanera_name, r.status, r.is_quinceanera
  from public.reservations r
 where public.svis_norm(r.quinceanera_name) like '%jamie%'
   and public.svis_norm(r.quinceanera_name) like '%darias%'
 order by r.is_quinceanera desc, r.cabin_number;

-- What the resolver returns for her, and where the money stands.
select
  public.resolve_ship_visit_cabin('Jamie', 'Darias') as resolved_cabin_id,
  (select count(*) from public.ship_visit_registrations where reservation_id is null) as still_unattached,
  (select coalesce(sum(ship_visit_charge), 0) from public.reservations)               as total_ship_visit_charged;
