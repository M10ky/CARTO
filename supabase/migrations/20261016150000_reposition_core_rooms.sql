-- ÉTAPE 3 — Repositionnement des salles sur la grille cible
--
-- Cible (voir plan zone.png) : noyau central colonnes P→AG, la colonne AG étant
-- réservée au couloir de droite (inséré à l'étape 4). La colonne droite des
-- salles bascule de X (9 col.) vers Y (8 col.) ; la colonne gauche reste P (8).
--
-- Cette migration ne fait QUE déplacer / redimensionner les salles existantes :
--   • Pantry              : inchangé (39, P, 3×17)
--   • toilette 1 / 2      : 43, P / Y, 3×8   (couloir H sous Pantry en 42)
--   • Stock Fin / Server  : 48, P / Y, 3×8
--   • Stock 2 / Stock 1   : 51, P / Y, 3×8
--   • toilette 3 / 4      : 54, P / Y, 3×8
--   • ZOOM / SMART / SHINE: 60, P / V / AB, 7×5  (bande-titre en 59)
--   • B4B / DRH / RH      : 70 / 73 / 76, P, 3 / 3 / 5 × 8
--   • Multimedia / ZEN    : 70 / 76, Y, 4 / 5 × 8
--
-- Les couloirs (AISLE) et bandes-titre (STRIP) sont insérés à l'étape 4.
--
-- Non-régression : aucun siège ni zone n'est modifié. Seul chevauchement
-- attendu = les 3 postes RH Q80/S80/U80 désormais à l'intérieur de la salle RH
-- (76→80) ; les 6 autres postes RH (lignes 81-82) débordent sous la salle.
-- Ces 9 postes sont traités explicitement à l'étape 6.
--
-- Idempotent : uniquement des UPDATE ciblés par label.

-- 1. Bloc sanitaires / stock : colonne droite X(9) → Y(8), décalage vers le bas.
update public.plan_annotations
   set grid_row = 43, grid_col = 'P', row_span = 3, col_span = 8
 where label = 'toilette 1';

update public.plan_annotations
   set grid_row = 43, grid_col = 'Y', row_span = 3, col_span = 8
 where label = 'toilette 2';

update public.plan_annotations
   set grid_row = 48, grid_col = 'P', row_span = 3, col_span = 8
 where label = 'Stock Fin';

update public.plan_annotations
   set grid_row = 48, grid_col = 'Y', row_span = 3, col_span = 8
 where label = 'Server';

update public.plan_annotations
   set grid_row = 51, grid_col = 'P', row_span = 3, col_span = 8
 where label = 'Stock 2';

update public.plan_annotations
   set grid_row = 51, grid_col = 'Y', row_span = 3, col_span = 8
 where label = 'Stock 1';

update public.plan_annotations
   set grid_row = 54, grid_col = 'P', row_span = 3, col_span = 8
 where label = 'toilette 3';

update public.plan_annotations
   set grid_row = 54, grid_col = 'Y', row_span = 3, col_span = 8
 where label = 'toilette 4';

-- 2. Salles de réunion : rangée 60 (sous la bande-titre de la ligne 59),
--    largeur ramenée à 5 colonnes (P / V / AB), couloirs U et AA libres.
update public.plan_annotations
   set grid_row = 60, grid_col = 'P', row_span = 7, col_span = 5
 where label = 'ZOOM';

update public.plan_annotations
   set grid_row = 60, grid_col = 'V', row_span = 7, col_span = 5
 where label = 'SMART';

update public.plan_annotations
   set grid_row = 60, grid_col = 'AB', row_span = 7, col_span = 5
 where label = 'SHINE';

-- 3. Bloc bas : remonté pour finir ligne 80 (baseline de la grille cible).
update public.plan_annotations
   set grid_row = 70, grid_col = 'P', row_span = 3, col_span = 8
 where label = 'B4B';

update public.plan_annotations
   set grid_row = 73, grid_col = 'P', row_span = 3, col_span = 8
 where label = 'DRH';

update public.plan_annotations
   set grid_row = 76, grid_col = 'P', row_span = 5, col_span = 8
 where label = 'RH';

update public.plan_annotations
   set grid_row = 70, grid_col = 'Y', row_span = 4, col_span = 8
 where label = 'Multimedia';

update public.plan_annotations
   set grid_row = 76, grid_col = 'Y', row_span = 5, col_span = 8
 where label = 'ZEN';
