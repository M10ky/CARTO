-- PHASE 4 — Sécurité : Row Level Security + privilèges

-- ---------------------------------------------------------------------------
-- Protection anti-escalade de rôle sur les profils
-- ---------------------------------------------------------------------------

create or replace function public.prevent_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Seul un administrateur peut modifier les rôles';
  end if;
  if new.is_active is distinct from old.is_active and not public.is_admin() then
    raise exception 'Seul un administrateur peut activer/désactiver un profil';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_change
before update on public.profiles
for each row execute function public.prevent_profile_privilege_change();

-- ---------------------------------------------------------------------------
-- Activation RLS
-- ---------------------------------------------------------------------------

alter table public.profiles            enable row level security;
alter table public.seat_statuses       enable row level security;
alter table public.zones               enable row level security;
alter table public.zone_rows           enable row level security;
alter table public.seats               enable row level security;
alter table public.plan_annotations    enable row level security;
alter table public.employees           enable row level security;
alter table public.pc_assets           enable row level security;
alter table public.assignments         enable row level security;
alter table public.maintenance_tickets enable row level security;
alter table public.audit_log           enable row level security;

-- ---------------------------------------------------------------------------
-- Politiques : profils
-- ---------------------------------------------------------------------------

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (public.is_admin());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Politiques : référentiel des statuts (lecture pour tous, écriture managers)
-- ---------------------------------------------------------------------------

create policy seat_statuses_select on public.seat_statuses
  for select to authenticated
  using (true);

create policy seat_statuses_write on public.seat_statuses
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

-- ---------------------------------------------------------------------------
-- Politiques : cartographie éditable
-- ---------------------------------------------------------------------------

create policy zones_select on public.zones
  for select to authenticated
  using (true);

create policy zones_write on public.zones
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy zone_rows_select on public.zone_rows
  for select to authenticated
  using (true);

create policy zone_rows_write on public.zone_rows
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy seats_select on public.seats
  for select to authenticated
  using (true);

create policy seats_write on public.seats
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy plan_annotations_select on public.plan_annotations
  for select to authenticated
  using (true);

create policy plan_annotations_write on public.plan_annotations
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

-- ---------------------------------------------------------------------------
-- Politiques : données métier
-- ---------------------------------------------------------------------------

create policy employees_select on public.employees
  for select to authenticated
  using (true);

create policy employees_write on public.employees
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy pc_assets_select on public.pc_assets
  for select to authenticated
  using (true);

create policy pc_assets_write on public.pc_assets
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy assignments_select on public.assignments
  for select to authenticated
  using (true);

create policy assignments_write on public.assignments
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

create policy maintenance_tickets_select on public.maintenance_tickets
  for select to authenticated
  using (true);

create policy maintenance_tickets_write on public.maintenance_tickets
  for all to authenticated
  using (public.can_edit())
  with check (public.can_edit());

-- ---------------------------------------------------------------------------
-- Politiques : journal d'audit (lecture admin uniquement)
-- ---------------------------------------------------------------------------

create policy audit_log_select on public.audit_log
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Privilèges (RLS reste la barrière d'accès)
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on public.profiles,
     public.seat_statuses,
     public.zones,
     public.zone_rows,
     public.seats,
     public.plan_annotations,
     public.employees,
     public.pc_assets,
     public.assignments,
     public.maintenance_tickets
  to authenticated;

grant select on public.audit_log to authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to authenticated, service_role;
