-- ZOOM / SMART / SHINE en blocs carrés
--
-- Les trois salles de la rangée 54 passent de 3 lignes de haut à 7 lignes
-- (lignes 54→60) pour devenir de vrais carrés (6×7 cellules ≈ 156×154 px),
-- alignés entre eux. SHINE s'élargit d'une colonne (AB→AG) pour égaler la
-- largeur des deux autres. La table de ZOOM est recentrée (lignes 57-58).
-- Aucune zone/seat existant n'est concerné : la bande lignes 54-60,
-- colonnes P→AG est vide de postes.

update public.plan_annotations
   set row_span = 7
 where label = 'ZOOM'
   and grid_row = 54;

update public.plan_annotations
   set row_span = 7
 where label = 'SMART'
   and grid_row = 54;

update public.plan_annotations
   set row_span = 7, col_span = 6
 where label = 'SHINE'
   and grid_row = 54;

update public.plan_annotations
   set grid_row = 57, row_span = 2
 where label = 'Table ZOOM';
