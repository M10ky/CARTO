-- PHASE 6 — Intégrité du parc informatique
-- Contraint le statut des équipements aux valeurs gérées par l'application.

alter table public.pc_assets
  drop constraint if exists pc_assets_status_check;

alter table public.pc_assets
  add constraint pc_assets_status_check
  check (status in ('UNKNOWN', 'IN_USE', 'IN_STOCK', 'MAINTENANCE', 'RETIRED'));
