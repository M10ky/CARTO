-- ÉTAPE 1 — kinds AISLE et STRIP pour les annotations du plan
--
-- Aucun changement visuel : aucune ligne n'est insérée ni modifiée.
-- La migration étend uniquement la contrainte de `plan_annotations.kind`
-- avec deux kinds qui seront peuplés aux étapes suivantes :
--   AISLE — couloir / allée (bleu uni, sans bordure)
--   STRIP — bande-titre fine (libellé seul, aucun aplat)
--
-- Idempotent : la contrainte est recréée à l'identique + les 2 kinds,
-- quel que soit l'état courant (seed seul, rework, architect_layout…).

alter table public.plan_annotations
  drop constraint if exists plan_annotations_kind_check;

alter table public.plan_annotations
  add constraint plan_annotations_kind_check
  check (kind in (
    'ZONE', 'RANGEE', 'WING', 'FREE', 'SPECIAL',
    'PANTRY', 'TOILET', 'STOCK', 'SERVER', 'OFFICE', 'STAIR',
    'MEETING', 'TABLE', 'BOX',
    'AISLE', 'STRIP'
  ));
