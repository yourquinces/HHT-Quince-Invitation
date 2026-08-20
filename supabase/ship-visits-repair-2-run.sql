-- Ship visits repair, step 2 of 2: run it, and look.
--
-- Separate from the install on purpose. If anything in here throws, step 1's
-- functions and triggers are already committed and stay put — only this rolls
-- back, and the error names the line.

-- Attach every registration whose quinceañera cabin can be identified.
select public.resolve_ship_visit_cabins();

-- Every live cabin carrying her name, and which one is flagged as hers.
-- More than one flagged means the resolver refuses to guess.
select r.cabin_number, r.booking_number, r.quinceanera_name, r.status, r.is_quinceanera
  from public.reservations r
 where public.svis_norm(r.quinceanera_name) like '%jamie%'
   and public.svis_norm(r.quinceanera_name) like '%darias%'
 order by r.is_quinceanera desc, r.cabin_number;

-- Where things stand.
select
  public.resolve_ship_visit_cabin('Jamie', 'Darias') as resolved_cabin_id,
  (select count(*) from public.ship_visit_registrations where reservation_id is null) as still_unattached,
  (select coalesce(sum(ship_visit_charge), 0) from public.reservations)               as total_charged;
