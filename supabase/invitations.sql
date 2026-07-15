-- ====================================================================
-- Quinceañera invitation pages — run once in the Supabase SQL editor
-- (same project HHT-QRS uses: jpgwcfswnfytyqzklrba).
--
-- One row = one live invitation page at  /i/<slug>  on the invitation
-- site. HHT-QRS inserts a row automatically when an agent approves a
-- cabin whose reservation is marked as a quinceañera.
-- ====================================================================

create table public.invitations (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  -- kept as text (no FK) so this works regardless of reservations.id type
  reservation_id   text,

  quinceanera_name text not null,
  preferred_name   text not null,
  group_name       text,

  -- page content; null = the invitation site's built-in default
  family_message   text,
  signature        text,
  hero_image_url   text,
  image_position   text,
  registry_url     text,
  starting_price   text,

  -- optional cruise overrides (defaults are the Icon 2027 group sailing)
  ship             text,
  sailing_dates    text,

  -- optional assigned-agent overrides
  agent_name       text,
  agent_phone      text,
  agent_whatsapp   text,
  agent_email      text,

  status           text not null default 'active'
                   check (status in ('active', 'disabled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.invitations enable row level security;

-- Guests (anonymous visitors of the invitation site) may read active pages.
create policy "Public can view active invitations"
  on public.invitations for select
  using (status = 'active');

-- Logged-in HHT agents (QRS) may create and manage invitations.
create policy "Agents can manage invitations"
  on public.invitations for all
  to authenticated
  using (true)
  with check (true);
