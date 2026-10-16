-- ÉTAPE 4 — Insertion des couloirs (AISLE) et bandes-titre (STRIP)
--
-- Allées en bleu uni sans bordure (kind AISLE, aucune étiquette rendue) et
-- bandes-titre fines au-dessus des salles de réunion (kind STRIP, libellé seul).
-- Positions issues de la grille cible (plan zone.png) :
--
--   • Couloir H sous Pantry : 42, P,  1×17  (P→AF)
--   • Couloir V central     : 43, X, 16×1   (rangs 43→58)
--   • Couloirs V salles     : 60, U / AA, 7×1 (rangs 60→66)
--   • Couloir H « Zone 1 »  : 68, P,  1×18  (P→AG)
--   • Couloir V bas         : 69, X, 12×1   (rangs 69→80)
--   • Couloir V bord droit  : 58, AG, 23×1  (rangs 58→80)
--   • Bandes-titre          : 59, P / V / AB, 1×5 (ZOOM / SMART / SHINE)
--
-- Aucune salle, aucun siège, aucune zone n'est modifié. Les libellés des
-- bandes-titre réutilisent le nom des salles ; toute requête ultérieure sur
-- ces noms doit filtrer sur `kind` (ex. `where kind = 'MEETING'`).
--
-- Idempotent : purge des AISLE/STRIP existants puis réinsertion.

delete from public.plan_annotations
 where kind in ('AISLE', 'STRIP');

insert into public.plan_annotations (label, kind, grid_row, grid_col, row_span, col_span)
values
  ('Couloir Pantry', 'AISLE', 42, 'P',  1, 17),
  ('Couloir central', 'AISLE', 43, 'X', 16,  1),
  ('Couloir U',       'AISLE', 60, 'U',  7,  1),
  ('Couloir AA',      'AISLE', 60, 'AA', 7,  1),
  ('Couloir Zone 1',  'AISLE', 68, 'P',  1, 18),
  ('Couloir bas',     'AISLE', 69, 'X', 12,  1),
  ('Couloir droit',   'AISLE', 58, 'AG', 23, 1),
  ('ZOOM',            'STRIP', 59, 'P',  1,  5),
  ('SMART',           'STRIP', 59, 'V',  1,  5),
  ('SHINE',           'STRIP', 59, 'AB', 1,  5);
