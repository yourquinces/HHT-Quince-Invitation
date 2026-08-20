-- One-off: clear every ship visit registration.
--
-- Run when the tour list is test data and you want to start clean. Visit
-- dates, their capacity and their price are all kept — only the people go.
--
-- Deleting a registration fires ship_visit_charge_sync_trg, so any cabin that
-- was carrying a ship visit charge is credited back to zero on the way out.
-- Since the charge now feeds cruise_total, that cabin's TOTAL AND BALANCE drop
-- with it — this moves money, not just a list. Nothing else in QRS references
-- these rows.
--
-- THIS CANNOT BE UNDONE.

delete from public.ship_visit_registrations;

-- All three should come back 0.
select
  (select count(*) from public.ship_visit_registrations)                     as registrations_left,
  (select count(*) from public.reservations where ship_visit_charge <> 0)    as cabins_still_charged,
  (select count(*) from public.ship_visits where not active)                 as closed_dates_untouched;
