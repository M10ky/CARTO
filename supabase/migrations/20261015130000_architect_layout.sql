-- PLAN ARCHITECTE — refonte du noyau central bas (entrée) + BOX 4 / BOX 5
--
-- Objectifs :
--  1. Aligner la salle RH, la salle ZEN et le BOX 5 sur la même ligne de base
--     (ligne 83) ; c'est le niveau le plus bas = entrée du cluster.
--  2. Descendre le bloc bas (B4B, DRH, RH, Multimedia, ZEN) en lignes 73→83 et
--     laisser le couloir d'entrée sur la colonne X (exactement entre RH et ZEN).
--  3. ZOOM et ZEN deviennent des salles de réunion (kind MEETING) avec une table
--     centrale (kind TABLE).
--  4. BOX 4 = 3 petites salles (1 PC chacune, postes existants ligne 60).
--     BOX 5 = 1 petite salle (poste existant ligne 83).
--  5. Créer les 9 postes de la salle RH (rattachés à la zone AN-Z1).
--
-- Le seed d'origine (20261009120300_seed_spatial.sql) et le correctif espaces
-- (20261015120000_special_areas_rework.sql) restent inchangés : cette migration
-- corrige/complète l'existant.

-- 1. Extension de la contrainte de kind (MEETING, TABLE, BOX).
alter table public.plan_annotations
  drop constraint if exists plan_annotations_kind_check;

alter table public.plan_annotations
  add constraint plan_annotations_kind_check
  check (kind in (
    'ZONE', 'RANGEE', 'WING', 'FREE', 'SPECIAL',
    'PANTRY', 'TOILET', 'STOCK', 'SERVER', 'OFFICE', 'STAIR',
    'MEETING', 'TABLE', 'BOX'
  ));

-- 2. Réalignement du bloc bas (baseline ligne 83, couloir colonne X).
update public.plan_annotations
   set kind = 'MEETING', grid_row = 54, grid_col = 'P', row_span = 3, col_span = 6
 where label = 'ZOOM';

update public.plan_annotations
   set kind = 'OFFICE', grid_row = 54, grid_col = 'V', row_span = 3, col_span = 6
 where label = 'SMART';

update public.plan_annotations
   set kind = 'OFFICE', grid_row = 54, grid_col = 'AB', row_span = 3, col_span = 5
 where label = 'SHINE';

update public.plan_annotations
   set kind = 'OFFICE', grid_row = 73, grid_col = 'P', row_span = 2, col_span = 8
 where label = 'B4B';

update public.plan_annotations
   set kind = 'OFFICE', grid_row = 75, grid_col = 'P', row_span = 2, col_span = 8
 where label = 'DRH';

update public.plan_annotations
   set kind = 'OFFICE', grid_row = 77, grid_col = 'P', row_span = 7, col_span = 8
 where label = 'RH';

update public.plan_annotations
   set kind = 'OFFICE', grid_row = 73, grid_col = 'Y', row_span = 4, col_span = 8
 where label = 'Multimedia';

update public.plan_annotations
   set kind = 'MEETING', grid_row = 77, grid_col = 'Y', row_span = 7, col_span = 8
 where label = 'ZEN';

-- 3. Nettoyage idempotent des éléments propres à cette migration.
delete from public.plan_annotations
 where label in (
   'Table ZOOM', 'Table ZEN',
   'Box 4.1', 'Box 4.2', 'Box 4.3', 'Box 5'
 );

-- 4. Tables de réunion (rectangles centraux dans ZOOM et ZEN).
insert into public.plan_annotations (label, kind, grid_row, grid_col, row_span, col_span)
values
  ('Table ZOOM', 'TABLE', 55, 'R',  1, 3),
  ('Table ZEN',  'TABLE', 80, 'AA', 2, 4);

-- 5. BOX 4 (3 petites salles) et BOX 5 (1 petite salle).
insert into public.plan_annotations (label, kind, grid_row, grid_col, row_span, col_span)
values
  ('Box 4.1', 'BOX', 59, 'AJ', 3, 3),
  ('Box 4.2', 'BOX', 59, 'AM', 3, 3),
  ('Box 4.3', 'BOX', 59, 'AP', 3, 3),
  ('Box 5',   'BOX', 81, 'AJ', 3, 3);

-- 6. Salle RH : 3 rangées dédiées dans la zone AN-Z1.
insert into public.zone_rows (zone_id, sort_order, label)
select z.id, v.sort_order, v.label
from (values
  ('AN-Z1', 11, 'RH — Rangée 1'),
  ('AN-Z1', 12, 'RH — Rangée 2'),
  ('AN-Z1', 13, 'RH — Rangée 3')
) as v(zone_code, sort_order, label)
join public.zones z on z.code = v.zone_code
on conflict (zone_id, sort_order) do update
  set label = excluded.label;

-- 7. Salle RH : 9 postes (grille 3×3, lignes 80-82, colonnes Q/S/U).
insert into public.seats (zone_id, row_id, code, label, status, grid_row, grid_col)
select z.id, r.id, v.code, v.label, 'FREE', v.grid_row, v.grid_col
from (values
  ('AN-Z1', 11, 'AN-Z1-R11-P01', 'Q80', 80, 'Q'),
  ('AN-Z1', 11, 'AN-Z1-R11-P02', 'S80', 80, 'S'),
  ('AN-Z1', 11, 'AN-Z1-R11-P03', 'U80', 80, 'U'),
  ('AN-Z1', 12, 'AN-Z1-R12-P01', 'Q81', 81, 'Q'),
  ('AN-Z1', 12, 'AN-Z1-R12-P02', 'S81', 81, 'S'),
  ('AN-Z1', 12, 'AN-Z1-R12-P03', 'U81', 81, 'U'),
  ('AN-Z1', 13, 'AN-Z1-R13-P01', 'Q82', 82, 'Q'),
  ('AN-Z1', 13, 'AN-Z1-R13-P02', 'S82', 82, 'S'),
  ('AN-Z1', 13, 'AN-Z1-R13-P03', 'U82', 82, 'U')
) as v(zone_code, row_order, code, label, grid_row, grid_col)
join public.zones z on z.code = v.zone_code
left join public.zone_rows r on r.zone_id = z.id and r.sort_order = v.row_order
on conflict (code) do update
  set zone_id  = excluded.zone_id,
      row_id   = excluded.row_id,
      label    = excluded.label,
      grid_row = excluded.grid_row,
      grid_col = excluded.grid_col;
