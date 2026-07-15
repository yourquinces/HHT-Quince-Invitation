-- Adds the sail date to invitations so each girl's page shows her own
-- sailing's cruise details and pricing. Run once in the Supabase SQL
-- editor (same project as invitations.sql).

alter table public.invitations
  add column if not exists sail_date date;
