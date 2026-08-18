-- Guest list for the quinceañera hub — /i/<slug>/guests
--
-- Everyone booked under her, read live from the reservation system so it
-- always matches what the agents have.
--
-- Trust model. The invitation site runs as `anon` on the same database as
-- HHT-QRS, and this returns other families' names, so it is gated on the
-- secret edit key that already protects her private hub link — the same
-- check update_invitation_by_key uses. anon gets EXECUTE on this one function
-- and no table access whatsoever. Do not widen RLS on reservations or
-- passengers to make this simpler.
--
-- What it deliberately does NOT return: fares, balances, payments, phone
-- numbers, emails, addresses. She is being told who is coming, not shown the
-- office's books or her guests' contact details.

create or replace function public.list_quince_guests(p_slug text, p_key text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv          record;
  v_norm_name    text;
  v_out          json;
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

  -- Her group is every cabin carrying her name on the same sailing. Her own
  -- cabin is included by id as well, in case the name on it was typed
  -- differently from the one on the invitation.
  with cabins as (
    select r.id, r.cabin_number, r.category, r.cabin_type, r.occupancy,
           r.is_quinceanera, r.status
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
               'category',       coalesce(c.cabin_type, c.category),
               'occupancy',      c.occupancy,
               'is_quinceanera', coalesce(c.is_quinceanera, false),
               'guests', coalesce((
                 select json_agg(json_build_object(
                          'first_name',     p.first_name,
                          'last_name',      p.last_name,
                          'is_quinceanera', coalesce(p.is_quinceanera, false)
                        ) order by p.position, p.id)
                 from public.passengers p where p.reservation_id = c.id
               ), '[]'::json)
             )
             -- Her cabin first, then by cabin number. Cabins not yet assigned
             -- a number sort last rather than leading with a blank.
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

-- anon may call it (the hub is a no-login page) but the key is what actually
-- authorises. Nothing else about these tables is reachable.
revoke all on function public.list_quince_guests(text, text) from public;
grant execute on function public.list_quince_guests(text, text) to anon, authenticated;
