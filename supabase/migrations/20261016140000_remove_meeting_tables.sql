-- ÉTAPE 2 — Suppression des tables de réunion intérieures
--
-- Les salles ZOOM et ZEN adoptent un style neutre (kind MEETING rendu comme
-- les bureaux, sans bordure accent) : les rectangles « table » qui étaient
-- dessinés à l'intérieur deviennent obsolètes et sont retirés.
--
-- Aucune autre annotation, aucun poste, aucune zone n'est touché.
-- Le kind TABLE reste autorisé par la contrainte (aucune donnée de ce type
-- ne subsiste) afin de ne pas durcir inutilement le schéma.
--
-- Idempotent : ré-exécuter la migration ne supprime rien de plus.

delete from public.plan_annotations
 where kind = 'TABLE'
   and label in ('Table ZOOM', 'Table ZEN');
