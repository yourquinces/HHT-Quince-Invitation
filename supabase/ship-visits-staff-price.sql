-- Fix: the staff monitor could not see a visit's price.
--
-- ship-visits-charges.sql added price_per_person to ship_visits and taught the
-- public list_ship_visits() to return it, but the staff page reads its dates
-- from list_ship_visit_registrations() — which builds its visit rows from a
-- hand-written field list that nobody updated. So the price box in the date
-- editor opened blank and the card read "$0 per person", and saving from that
-- screen would have written the blank straight back.
--
-- Safe to re-run.
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
