-- PHASE 4 — Référentiel des statuts de poste (configurable)

insert into public.seat_statuses (code, label, color, icon, description, sort_order)
values
  ('OCCUPIED',     'Occupé',              '#3ecf8e', 'check-circle',  'Poste attribué à un collaborateur', 1),
  ('FREE',         'Libre',               '#3fd3e6', 'circle',        'Poste disponible',                  2),
  ('UNAVAILABLE',  'Indisponible',        '#7e8ca6', 'ban',           'Poste non exploitable',             3),
  ('DAMAGED',      'Défectueux',          '#f2617a', 'alert-triangle','Poste ou matériel en panne',        4),
  ('MOVE_PLANNED', 'Déménagement prévu',  '#f2b466', 'move',          'Changement de position planifié',   5),
  ('TO_VERIFY',    'À vérifier',          '#9cb0cc', 'help-circle',   'Information à confirmer',           6)
on conflict (code) do update
  set label       = excluded.label,
      color       = excluded.color,
      icon        = excluded.icon,
      description = excluded.description,
      sort_order  = excluded.sort_order;
