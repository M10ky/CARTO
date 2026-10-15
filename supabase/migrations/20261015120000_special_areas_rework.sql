-- CORRECTIF ESPACES SPÉCIAUX — noyau central nommé
--
-- Les « Espace vide » génériques et l'ancien Pantry sont remplacés par des
-- zones nommées du noyau central (bande centrée colonnes P→AF, lignes 39→68).
-- L'escalier EST est conservé (re-kindé STAIR). Le seed d'origine
-- (20261009120300_seed_spatial.sql) reste inchangé : sur une installation
-- neuve il est appliqué puis corrigé par cette migration.
--
-- 1. Suppression des anciens espaces vides génériques + ancien Pantry.
-- 2. Extension de la contrainte de kind aux nouveaux types de salle.
-- 3. Insertion des blocs nommés.

delete from public.plan_annotations
 where kind = 'SPECIAL'
   and label in ('Espace vide', 'Pantry');

alter table public.plan_annotations
  drop constraint if exists plan_annotations_kind_check;

alter table public.plan_annotations
  add constraint plan_annotations_kind_check
  check (kind in (
    'ZONE', 'RANGEE', 'WING', 'FREE', 'SPECIAL',
    'PANTRY', 'TOILET', 'STOCK', 'SERVER', 'OFFICE', 'STAIR'
  ));

update public.plan_annotations
   set kind = 'STAIR'
 where kind = 'SPECIAL'
   and label = 'ESCALIER EST';

insert into public.plan_annotations (label, kind, grid_row, grid_col, row_span, col_span)
values
  ('Pantry',     'PANTRY', 39, 'P',  3, 17),
  ('toilette 1', 'TOILET', 42, 'P',  3,  8),
  ('toilette 2', 'TOILET', 42, 'X',  3,  9),
  ('Stock Fin',  'STOCK',  45, 'P',  3,  8),
  ('Server',     'SERVER', 45, 'X',  3,  9),
  ('Stock 2',    'STOCK',  48, 'P',  3,  8),
  ('Stock 1',    'STOCK',  48, 'X',  3,  9),
  ('toilette 3', 'TOILET', 51, 'P',  3,  8),
  ('toilette 4', 'TOILET', 51, 'X',  3,  9),
  ('ZOOM',       'OFFICE', 54, 'P',  3,  6),
  ('SMART',      'OFFICE', 54, 'V',  3,  6),
  ('SHINE',      'OFFICE', 54, 'AB', 3,  5),
  ('B4B',        'OFFICE', 59, 'P',  3,  8),
  ('DRH',        'OFFICE', 62, 'P',  3,  8),
  ('RH',         'OFFICE', 65, 'P',  4,  8),
  ('Multimedia', 'OFFICE', 59, 'X',  5,  9),
  ('ZEN',        'OFFICE', 64, 'X',  5,  9);
