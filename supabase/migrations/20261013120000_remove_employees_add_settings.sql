-- CORRECTIFS POST-PHASE 9 — Retrait du module Collaborateurs + paramètres applicatifs
--
-- 1. Les employés disparaissent complètement de l'application :
--    le périmètre fonctionnel est désormais exclusivement « position ↔ équipement ».
--    - colonnes `employee_id` retirées des tables `assignments` et `maintenance_tickets`
--      (les contraintes de clé étrangère partent avec les colonnes) ;
--    - table `employees` supprimée (politiques RLS, index et triggers attachés supprimés avec elle).
-- 2. Nouvelle table `app_settings` (clé/valeur + journalisation) pour le paramétrage applicatif.

-- ---------------------------------------------------------------------------
-- 1. Retrait des colonnes employés
-- ---------------------------------------------------------------------------

alter table public.assignments
  drop column if exists employee_id;

alter table public.maintenance_tickets
  drop column if exists employee_id;

-- ---------------------------------------------------------------------------
-- 2. Suppression de la table employés
-- ---------------------------------------------------------------------------

drop table if exists public.employees;

-- ---------------------------------------------------------------------------
-- 3. Paramètres applicatifs (clé/valeur, horodatés et audités)
-- ---------------------------------------------------------------------------

create table public.app_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  value       text not null,
  description text,
  updated_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index app_settings_updated_by_idx on public.app_settings (updated_by);

create trigger app_settings_set_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

create trigger app_settings_audit
after insert or update or delete on public.app_settings
for each row execute function public.audit_trigger();

-- Lecture pour tout utilisateur authentifié, écriture réservée aux administrateurs.

alter table public.app_settings enable row level security;

create policy app_settings_select on public.app_settings
  for select to authenticated
  using (true);

create policy app_settings_write on public.app_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Valeur d'initialisation : nom du cluster (le site l'affiche déjà).

insert into public.app_settings (key, value, description)
values ('cluster_name', 'Cluster CNTO', 'Nom affiché du cluster')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Privilèges (RLS reste la barrière d'accès)
-- ---------------------------------------------------------------------------

grant select, insert, update, delete on public.app_settings to authenticated;
grant all on public.app_settings to service_role;