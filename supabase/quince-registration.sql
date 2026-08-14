-- Quinceañera Registration Form
-- ---------------------------------------------------------------------------
-- Background details each girl fills in once she has booked. Safe to re-run.
--
-- Anonymous visitors can INSERT (through the function) but can never SELECT:
-- these rows hold minors' phone numbers, schools and social handles, so the
-- table stays behind RLS with no public read policy. Staff read it signed in.

create table if not exists public.quince_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Links the girl back to her invitation when she came from her hub.
  invitation_slug text,

  first_name text not null,
  last_name  text not null,
  cell_phone text,
  email      text,
  sail_date  text not null,

  -- "Another quinceañera you want to sit with at dinner"
  sit_with       boolean not null default false,
  sit_with_names text,

  instagram       text,
  facebook        text,
  tiktok          text,
  snapchat        text,
  favorite_social text,
  uses_whatsapp   boolean,

  high_school     text,
  graduation_year text,

  on_team   boolean,
  team_name text,

  parent_name      text,
  parent_instagram text
);

create index if not exists quince_registrations_slug_idx
  on public.quince_registrations (invitation_slug);
create index if not exists quince_registrations_sail_idx
  on public.quince_registrations (sail_date, last_name);

alter table public.quince_registrations enable row level security;

-- Agents signed into Supabase get full access; anon gets none directly.
drop policy if exists "agents manage registrations" on public.quince_registrations;
create policy "agents manage registrations"
  on public.quince_registrations for all
  to authenticated
  using (true) with check (true);

-- One jsonb argument rather than nineteen positional ones: the form can gain a
-- question without a signature change, and unknown keys are simply ignored.
create or replace function public.submit_quince_registration(p_data jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_first text := nullif(trim(p_data ->> 'first_name'), '');
  v_last  text := nullif(trim(p_data ->> 'last_name'), '');
  v_sail  text := nullif(trim(p_data ->> 'sail_date'), '');
begin
  if v_first is null or v_last is null or v_sail is null then
    raise exception 'first_name, last_name and sail_date are required';
  end if;

  insert into public.quince_registrations (
    invitation_slug, first_name, last_name, cell_phone, email, sail_date,
    sit_with, sit_with_names, instagram, facebook, tiktok, snapchat,
    favorite_social, uses_whatsapp, high_school, graduation_year,
    on_team, team_name, parent_name, parent_instagram
  ) values (
    nullif(trim(p_data ->> 'invitation_slug'), ''),
    v_first, v_last,
    nullif(trim(p_data ->> 'cell_phone'), ''),
    nullif(trim(p_data ->> 'email'), ''),
    v_sail,
    coalesce((p_data ->> 'sit_with')::boolean, false),
    nullif(trim(p_data ->> 'sit_with_names'), ''),
    nullif(trim(p_data ->> 'instagram'), ''),
    nullif(trim(p_data ->> 'facebook'), ''),
    nullif(trim(p_data ->> 'tiktok'), ''),
    nullif(trim(p_data ->> 'snapchat'), ''),
    nullif(trim(p_data ->> 'favorite_social'), ''),
    (p_data ->> 'uses_whatsapp')::boolean,
    nullif(trim(p_data ->> 'high_school'), ''),
    nullif(trim(p_data ->> 'graduation_year'), ''),
    (p_data ->> 'on_team')::boolean,
    nullif(trim(p_data ->> 'team_name'), ''),
    nullif(trim(p_data ->> 'parent_name'), ''),
    nullif(trim(p_data ->> 'parent_instagram'), '')
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- The hub asks only "has this girl registered?" so it can move the card down
-- the list. It returns a bare boolean and never any of her details.
create or replace function public.quince_registration_exists(p_slug text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.quince_registrations
    where invitation_slug = nullif(trim(p_slug), '')
  );
$$;

revoke all on function public.submit_quince_registration(jsonb) from public;
revoke all on function public.quince_registration_exists(text) from public;
grant execute on function public.submit_quince_registration(jsonb) to anon, authenticated;
grant execute on function public.quince_registration_exists(text) to anon, authenticated;
