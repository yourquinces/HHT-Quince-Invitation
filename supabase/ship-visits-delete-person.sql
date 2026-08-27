-- Ship visits: let staff remove one person from "who's going".
--
-- WHY AN RPC AND NOT A TABLE DELETE
-- RLS on ship_visit_registrations grants ALL to `authenticated` only, and the
-- staff page is key-gated, not logged in — it holds the anon publishable key.
-- So every staff write goes through a SECURITY DEFINER function that checks
-- the staff key itself, exactly like set_ship_visit_citizenship. Widening the
-- policy to anon instead would hand the whole roster to anyone with the
-- publishable key, which is in the browser bundle.
--
-- WHY IT IS NOT ALWAYS A ROW DELETE
-- The table is one flat row per party: quinceañera plus up to two guests. A
-- party can also exist with no quinceañera at all — that is the ?mode=guests
-- path, where she is already registered and the family is adding relatives,
-- and it sets registering_quince = false. So removing a person clears that
-- person's columns and re-counts the row. The row is deleted only when the
-- person removed was the last one on it; otherwise deleting the party would
-- take people with it who are still coming.
--
-- THE MONEY LOOKS AFTER ITSELF
-- ship_visit_charge_sync_trg fires AFTER INSERT OR UPDATE OR DELETE on this
-- table, so both branches re-post the cabin's ship_visit_charge without this
-- function touching a reservation. Do not "help" it here — two writers on that
-- number is how it drifts.
--
-- party_size is the stored headcount that capacity and the "booked" figure
-- both read, so it is recomputed from what is actually left rather than
-- decremented, which would drift if a row were ever edited by hand.

create or replace function public.delete_ship_visit_person(
  p_key text, p_id uuid, p_who text
) returns json
language plpgsql
security definer
set search_path = public
as $$
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
      quince_citizenship = null, registering_quince = false
    where id = p_id;

  elsif p_who = 'guest1' then
    select nullif(trim(coalesce(guest1_first, '') || ' ' || coalesce(guest1_last, '')), '')
      into v_name from public.ship_visit_registrations where id = p_id;
    update public.ship_visit_registrations set
      guest1_first = null, guest1_last = null, guest1_dob = null,
      guest1_email = null, guest1_id_type = null, guest1_id_number = null,
      guest1_citizenship = null
    where id = p_id;

  elsif p_who = 'guest2' then
    select nullif(trim(coalesce(guest2_first, '') || ' ' || coalesce(guest2_last, '')), '')
      into v_name from public.ship_visit_registrations where id = p_id;
    update public.ship_visit_registrations set
      guest2_first = null, guest2_last = null, guest2_dob = null,
      guest2_email = null, guest2_id_type = null, guest2_id_number = null,
      guest2_citizenship = null
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
    into v_remaining
  from public.ship_visit_registrations where id = p_id;

  if v_remaining = 0 then
    delete from public.ship_visit_registrations where id = p_id;
    return json_build_object('ok', true, 'name', v_name, 'party_deleted', true, 'party_size', 0);
  end if;

  update public.ship_visit_registrations set party_size = v_remaining where id = p_id;
  return json_build_object('ok', true, 'name', v_name, 'party_deleted', false, 'party_size', v_remaining);
end;
$$;

revoke all on function public.delete_ship_visit_person(text, uuid, text) from public;
grant execute on function public.delete_ship_visit_person(text, uuid, text) to anon, authenticated;
