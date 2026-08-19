-- One-off: clear every ship visit registration.
--
-- Run when the tour list is test data and you want to start clean. Visit
-- dates, their capacity and their price are all kept — only the people go.
--
-- Deleting a registration fires ship_visit_charge_sync_trg, so any cabin that
-- was carrying a ship visit charge is credited back to zero on the way out.
-- Nothing else in QRS references these rows.
--
-- THIS CANNOT BE UNDONE.

delete from public.ship_visit_registrations;

-- Both of these should come back 0.
select
  (select count(*) from public.ship_visit_registrations)                    as registrations_left,
  (select count(*) from public.reservations where ship_visit_charge <> 0)   as cabins_still_charged;
