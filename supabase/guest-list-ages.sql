-- Guest list, second pass: age at sailing and the booking number.
--
-- The AGE is computed against the sail date rather than today, because that is
-- the number that matters — who is a minor when we sail, who is 21 by then.
-- Note it returns the age and NOT the date of birth: the page gains what it is
-- for without handing every guest's birthday to whoever holds the link. Keep
-- it that way.
--
-- Safe to re-run.
create or replace function public.list_quince_guests(p_slug text, p_key text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv       record;
  v_norm_name text;
  v_out       json;
begin
  -- Same gate as the family editor: slug + secret key, active invitations only.
  select i.id, i.reservation_id, i.quinceanera_name, i.preferred_name,
         i.sail_date, i.ship
    into v_inv
  from public.invitations i
  join public.invitation_edit_keys k on k.invitation_id = i.id
  where i.slug = p_slug
    and k.edit_key = p_key
    and i.status = 'active';

  if v_inv.id is null then
    return null;                      -- wrong key or unknown girl: say nothing
  end if;

  v_norm_name := upper(regexp_replace(trim(coalesce(v_inv.quinceanera_name, '')), '\s+', ' ', 'g'));

  with cabins as (
    select r.id, r.cabin_number, r.booking_number, r.category, r.cabin_type,
           r.occupancy, r.is_quinceanera, r.status, r.sail_date
    from public.reservations r
    where coalesce(r.status, '') not in ('CX', 'PR')
      and (
        r.id::text = v_inv.reservation_id
        or (
          upper(regexp_replace(trim(coalesce(r.quinceanera_name, '')), '\s+', ' ', 'g')) = v_norm_name
          and (v_inv.sail_date is null or r.sail_date = v_inv.sail_date)
        )
      )
  )
  select json_build_object(
    'quinceanera', coalesce(v_inv.preferred_name, v_inv.quinceanera_name),
    'ship',        v_inv.ship,
    'sail_date',   v_inv.sail_date,
    'cabins', coalesce((
      select json_agg(json_build_object(
               'cabin_number',   c.cabin_number,
               'booking_number', c.booking_number,
               'category',       coalesce(c.cabin_type, c.category),
               'occupancy',      c.occupancy,
               'is_quinceanera', coalesce(c.is_quinceanera, false),
               'guests', coalesce((
                 select json_agg(json_build_object(
                          'first_name',     p.first_name,
                          'last_name',      p.last_name,
                          'is_quinceanera', coalesce(p.is_quinceanera, false),
                          -- Age ON the sail date, not today. Null when no date
                          -- of birth was entered; passengers.age is a legacy
                          -- text column and is empty across the whole table, so
                          -- there is nothing to fall back to.
                          'age_at_sailing',
                            case
                              when p.dob is not null and coalesce(c.sail_date, v_inv.sail_date) is not null
                                then extract(year from age(coalesce(c.sail_date, v_inv.sail_date), p.dob))::int
                            end
                        ) order by p.position, p.id)
                 from public.passengers p where p.reservation_id = c.id
               ), '[]'::json)
             )
             order by coalesce(c.is_quinceanera, false) desc,
                      nullif(regexp_replace(coalesce(c.cabin_number, ''), '\D', '', 'g'), '')::int
                        nulls last,
                      c.cabin_number)
      from cabins c
    ), '[]'::json)
  ) into v_out;

  return v_out;
end;
$$;

revoke all on function public.list_quince_guests(text, text) from public;
grant execute on function public.list_quince_guests(text, text) to anon, authenticated;
