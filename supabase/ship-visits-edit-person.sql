-- Ship visits: let staff correct a person's details from the roster.
--
-- WHY THIS EXISTS
-- The roster is the manifest that goes to the port, and the name and ID on it
-- have to match the document the person actually brings. Families mistype
-- both. Until now the only field staff could touch was citizenship, so a
-- wrong passport number meant asking the family to register again — which
-- also double-counts the capacity.
--
-- SAME GATE AS EVERYTHING ELSE HERE
-- RLS grants ALL to `authenticated` only and the staff page is key-gated, not
-- logged in, so this is SECURITY DEFINER behind the staff key, exactly like
-- set_ship_visit_citizenship and delete_ship_visit_person.
--
-- WHY A COLUMN NAME IS SAFE TO BUILD HERE
-- The column is never taken from the caller. p_who and p_field are each
-- checked against a fixed list first, and only then joined — so the set of
-- reachable columns is closed, and a caller cannot reach party_size,
-- visit_id, registering_quince or anything else that would let the roster
-- lie about its own headcount.

create or replace function public.set_ship_visit_field(
  p_key text, p_id uuid, p_who text, p_field text, p_value text
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  STAFF_KEY constant text := 'c439d8dfe7b7d0f910424075';
  PERSON_FIELDS constant text[] :=
    array['first', 'last', 'dob', 'email', 'id_type', 'id_number', 'citizenship'];
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
  elsif p_who in ('quince', 'guest1', 'guest2') then
    if not (p_field = any (PERSON_FIELDS)) then
      return json_build_object('ok', false, 'error', format('Field "%s" is not editable.', p_field));
    end if;
    v_col := p_who || '_' || p_field;
  else
    return json_build_object('ok', false, 'error', format('Unknown person "%s".', p_who));
  end if;

  -- A date column will not take free text, and an agent who fat-fingers one
  -- should be told rather than shown a Postgres error in an alert box.
  if p_field = 'dob' then
    if v_val is null then
      v_date := null;
    else
      begin
        v_date := v_val::date;
      exception when others then
        return json_build_object('ok', false, 'error', 'That date of birth is not a real date.');
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
    + (case when coalesce(guest2_first, guest2_last) is not null then 1 else 0 end))
  where id = p_id;

  return json_build_object('ok', true, 'value', case when p_field = 'dob' then v_date::text else v_val end);
end;
$$;

revoke all on function public.set_ship_visit_field(text, uuid, text, text, text) from public;
grant execute on function public.set_ship_visit_field(text, uuid, text, text, text) to anon, authenticated;
