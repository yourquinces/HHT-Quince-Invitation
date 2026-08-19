-- Ship visits, fifth pass: stop asking agents to match anything.
--
-- The registration already says whose quinceañera it is — that is the first
-- question the form asks. Making an agent then point it at a cabin was asking
-- them to re-enter something the system already knew. The party now attaches
-- itself to her cabin by name, and the only thing a human ever sees is the
-- exception: a name that resolves to no cabin, or to more than one.
--
-- Safe to re-run.

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
  v_id    uuid;
  v_n     integer;
begin
  if v_first = '' or v_last = '' then return null; end if;

  -- Her own cabin: the reservation flagged as the one she is sailing in.
  select count(*), min(r.id) into v_n, v_id
    from public.reservations r
   where r.is_quinceanera
     and upper(coalesce(r.status, '')) not in ('CX', 'CANCELLED', 'CANCEL')
     and svis_norm(r.quinceanera_name) like '%' || v_first || '%'
     and svis_norm(r.quinceanera_name) like '%' || v_last  || '%';
  if v_n = 1 then return v_id; end if;
  if v_n > 1 then return null; end if;   -- ambiguous: do not guess

  -- Nothing flagged. Some older groups never had the flag set, so fall back to
  -- any live cabin carrying her name — still only when there is exactly one.
  select count(*), min(r.id) into v_n, v_id
    from public.reservations r
   where upper(coalesce(r.status, '')) not in ('CX', 'CANCELLED', 'CANCEL')
     and svis_norm(r.quinceanera_name) like '%' || v_first || '%'
     and svis_norm(r.quinceanera_name) like '%' || v_last  || '%';
  if v_n = 1 then return v_id; end if;

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
