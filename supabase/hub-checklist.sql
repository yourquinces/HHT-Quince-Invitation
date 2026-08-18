-- The quinceañera's checklist on her hub.
--
-- Two kinds of item, and the difference is the whole design:
--
--   Earned  — registration and the ship visit. We already know whether she has
--             done these, so she never ticks them; they go green on their own
--             the moment the record exists. A checklist you can tick without
--             doing the thing is a to-do list, not progress.
--   Ticked  — WhatsApp, Instagram, X, and the two invitations. Nothing on our
--             side can see these, so she marks them herself.
--
-- Ticks live in a jsonb column on her invitation rather than a table of their
-- own: there are a handful per girl, they are read on every hub load anyway,
-- and this keeps them arriving with the row she is already fetching.
--
-- Safe to re-run.
alter table public.invitations
  add column if not exists checklist jsonb not null default '{}'::jsonb;

comment on column public.invitations.checklist is
  'Self-ticked hub checklist items, {item_key: true}. Earned items are computed, not stored here.';

-- Lets the ship visit form say which girl it belongs to when it is opened from
-- her hub, so that item can go green on its own instead of being self-ticked.
alter table public.ship_visit_registrations
  add column if not exists invitation_slug text;

create index if not exists ship_visit_reg_slug_idx
  on public.ship_visit_registrations (invitation_slug);

-- ---------------------------------------------------------------------------
-- Tick / untick, behind her secret key
-- ---------------------------------------------------------------------------
create or replace function public.set_checklist_item(
  p_slug text, p_key text, p_item text, p_done boolean
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select i.id into v_id
  from public.invitations i
  join public.invitation_edit_keys k on k.invitation_id = i.id
  where i.slug = p_slug and k.edit_key = p_key and i.status = 'active';

  if v_id is null or coalesce(trim(p_item), '') = '' then
    return false;
  end if;

  update public.invitations
     set checklist = case
           when p_done then coalesce(checklist, '{}'::jsonb) || jsonb_build_object(p_item, true)
           else coalesce(checklist, '{}'::jsonb) - p_item
         end,
         updated_at = now()
   where id = v_id;

  return true;
end;
$$;

revoke all on function public.set_checklist_item(text, text, text, boolean) from public;
grant execute on function public.set_checklist_item(text, text, text, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- What is done — the earned items plus her ticks, in one call
-- ---------------------------------------------------------------------------
-- Readable by slug without the key: this says only whether she has registered
-- or booked a tour, which her hub already showed, and no personal detail.
create or replace function public.quince_hub_progress(p_slug text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv       record;
  v_norm      text;
  v_registered boolean;
  v_shipvisit  boolean;
begin
  select i.quinceanera_name, i.preferred_name, i.checklist
    into v_inv
  from public.invitations i
  where i.slug = p_slug and i.status = 'active';

  if v_inv is null then
    return null;
  end if;

  select exists (
    select 1 from public.quince_registrations r where r.invitation_slug = p_slug
  ) into v_registered;

  -- Exact when the form carried her slug; otherwise fall back to her name, so
  -- registrations taken before that existed still count.
  v_norm := upper(regexp_replace(trim(coalesce(v_inv.quinceanera_name, '')), '\s+', ' ', 'g'));
  select exists (
    select 1 from public.ship_visit_registrations s
    where s.invitation_slug = p_slug
       or (
         s.registering_quince
         and upper(regexp_replace(trim(coalesce(s.quince_first, '') || ' ' || coalesce(s.quince_last, '')), '\s+', ' ', 'g')) = v_norm
       )
  ) into v_shipvisit;

  return json_build_object(
    'registered', v_registered,
    'ship_visit', v_shipvisit,
    'checklist',  coalesce(v_inv.checklist, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.quince_hub_progress(text) from public;
grant execute on function public.quince_hub_progress(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Record which girl a ship visit belongs to
-- ---------------------------------------------------------------------------
-- Only the insert changes: invitation_slug is carried through when the form was
-- opened from her hub, so the checklist item ticks itself instead of trusting a
-- self-report. Everything else — capacity, party size, one email per person —
-- is exactly as before.
create or replace function public.submit_ship_visit(p_data jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_visit record; v_size int; v_booked int; v_id uuid;
  v_with_q boolean; v_has_g1 boolean; v_has_g2 boolean;
  v_emails text[]; v_dupe text;
begin
  select * into v_visit from public.ship_visits
   where id = (p_data->>'visit_id')::uuid and active for update;
  if v_visit.id is null then
    return json_build_object('ok', false, 'error', 'That ship visit is no longer available.');
  end if;

  v_with_q := coalesce((p_data->>'registering_quince')::boolean, true);
  v_has_g1 := coalesce(trim(p_data->>'guest1_first'), '') <> '';
  v_has_g2 := coalesce(trim(p_data->>'guest2_first'), '') <> '';

  if not v_with_q and not v_has_g1 and not v_has_g2 then
    return json_build_object('ok', false,
      'error', 'Add at least one guest, or tick that the quinceañera is attending.');
  end if;

  v_size := (case when v_with_q then 1 else 0 end)
          + (case when v_has_g1 then 1 else 0 end)
          + (case when v_has_g2 then 1 else 0 end);

  select array_agg(e) into v_emails from (
    select lower(trim(x)) as e from unnest(array[
      case when v_with_q then p_data->>'quince_email' end,
      case when v_has_g1 then p_data->>'guest1_email' end,
      case when v_has_g2 then p_data->>'guest2_email' end
    ]) as x where coalesce(trim(x), '') <> ''
  ) s;

  if v_emails is not null then
    select e into v_dupe from (select unnest(v_emails) as e) t
      group by e having count(*) > 1 limit 1;
    if v_dupe is not null then
      return json_build_object('ok', false,
        'error', format('%s is entered twice. Each person needs their own email address.', v_dupe));
    end if;

    select lower(trim(e)) into v_dupe
    from public.ship_visit_registrations r
    cross join lateral (values (r.quince_email), (r.guest1_email), (r.guest2_email)) as v(e)
    where r.visit_id = v_visit.id and coalesce(trim(e), '') <> ''
      and lower(trim(e)) = any(v_emails) limit 1;
    if v_dupe is not null then
      return json_build_object('ok', false,
        'error', format('%s is already registered for this ship visit. Each person needs their own email address — if you are adding more guests, use their own addresses.', v_dupe));
    end if;
  end if;

  select coalesce(sum(party_size), 0) into v_booked
    from public.ship_visit_registrations where visit_id = v_visit.id;

  if v_booked + v_size > v_visit.capacity then
    return json_build_object('ok', false,
      'error', 'This ship visit is full. Please call the office and we will find you another date.',
      'remaining', greatest(v_visit.capacity - v_booked, 0));
  end if;

  insert into public.ship_visit_registrations (
    visit_id, registering_quince, invitation_slug,
    quince_first, quince_last, quince_dob, quince_email, quince_id_type, quince_id_number,
    sail_date, cell_phone,
    guest1_first, guest1_last, guest1_dob, guest1_email, guest1_id_type, guest1_id_number,
    guest2_first, guest2_last, guest2_dob, guest2_email, guest2_id_type, guest2_id_number,
    agent, notes, party_size
  ) values (
    v_visit.id, v_with_q, nullif(trim(p_data->>'invitation_slug'), ''),
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
    nullif(trim(p_data->>'agent'), ''), nullif(trim(p_data->>'notes'), ''), v_size
  ) returning id into v_id;

  return json_build_object('ok', true, 'id', v_id, 'party_size', v_size);
end;
$fn$;

revoke all on function public.submit_ship_visit(jsonb) from public;
grant execute on function public.submit_ship_visit(jsonb) to anon, authenticated;
