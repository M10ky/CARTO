-- PHASE 4 — Schéma initial : cartographie éditable + données métier
-- Projet : Cluster CNTO. Toutes les tables spatiales sont modifiables
-- (renommage des zones, déplacement des positions, annotations libres).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profils et rôles (lié à auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'VIEWER'
                check (role in ('ADMIN', 'MANAGER', 'VIEWER')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'ADMIN', false);
$$;

create or replace function public.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('ADMIN', 'MANAGER'), false);
$$;

-- Création automatique du profil au premier utilisateur (bootstrap admin)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  if (select count(*) from public.profiles) = 0 then
    assigned_role := 'ADMIN';
  else
    assigned_role := 'VIEWER';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    assigned_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Statuts de poste (configurables)
-- ---------------------------------------------------------------------------

create table public.seat_statuses (
  code        text primary key,
  label       text not null,
  color       text,
  icon        text,
  description text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cartographie éditable
-- ---------------------------------------------------------------------------

create table public.zones (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,
  name                text not null,
  wing                text not null
                        check (wing in ('CENTRAL', 'AILE_NORD', 'AILE_SUD')),
  kind                text not null default 'OPEN_SPACE'
                        check (kind in ('OPEN_SPACE', 'BOX', 'FORMATION', 'CENTRAL')),
  department          text,
  declared_positions  integer,
  color               text,
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.zone_rows (
  id          uuid primary key default gen_random_uuid(),
  zone_id     uuid not null references public.zones (id) on delete cascade,
  label       text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index zone_rows_zone_id_idx on public.zone_rows (zone_id);
create unique index zone_rows_zone_order_key on public.zone_rows (zone_id, sort_order);

create table public.seats (
  id          uuid primary key default gen_random_uuid(),
  zone_id     uuid not null references public.zones (id) on delete cascade,
  row_id      uuid references public.zone_rows (id) on delete set null,
  code        text not null unique,
  label       text,
  kind        text not null default 'SEAT',
  status      text not null default 'UNAVAILABLE'
                references public.seat_statuses (code),
  grid_row    integer,
  grid_col    text,
  pos_x       numeric,
  pos_y       numeric,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index seats_zone_id_idx on public.seats (zone_id);
create index seats_row_id_idx on public.seats (row_id);
create index seats_status_idx on public.seats (status);

create table public.plan_annotations (
  id          uuid primary key default gen_random_uuid(),
  zone_id     uuid references public.zones (id) on delete set null,
  label       text not null,
  kind        text not null default 'FREE'
                check (kind in ('ZONE', 'RANGEE', 'WING', 'FREE', 'SPECIAL')),
  grid_row    integer,
  grid_col    text,
  row_span    integer default 1,
  col_span    integer default 1,
  pos_x       numeric,
  pos_y       numeric,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index plan_annotations_zone_id_idx on public.plan_annotations (zone_id);

-- ---------------------------------------------------------------------------
-- Données métier
-- ---------------------------------------------------------------------------

create table public.employees (
  id          uuid primary key default gen_random_uuid(),
  matricule   text unique,
  first_name  text,
  last_name   text,
  full_name   text generated always as
                (trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) stored,
  service     text,
  job_title   text,
  email       text,
  phone       text,
  location    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.pc_assets (
  id            uuid primary key default gen_random_uuid(),
  asset_tag     text unique,
  serial_number text,
  manufacturer  text,
  model         text,
  asset_type    text,
  os            text,
  status        text not null default 'UNKNOWN',
  specs         jsonb,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.assignments (
  id           uuid primary key default gen_random_uuid(),
  seat_id      uuid references public.seats (id) on delete set null,
  employee_id  uuid references public.employees (id) on delete set null,
  pc_asset_id  uuid references public.pc_assets (id) on delete set null,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  is_active    boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index assignments_seat_id_idx on public.assignments (seat_id);
create index assignments_employee_id_idx on public.assignments (employee_id);
create index assignments_pc_asset_id_idx on public.assignments (pc_asset_id);

create table public.maintenance_tickets (
  id           uuid primary key default gen_random_uuid(),
  pc_asset_id  uuid references public.pc_assets (id) on delete set null,
  employee_id  uuid references public.employees (id) on delete set null,
  seat_id      uuid references public.seats (id) on delete set null,
  reference    text unique,
  title        text not null,
  description  text,
  priority     text not null default 'NORMAL'
                 check (priority in ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  status       text not null default 'OPEN'
                 check (status in ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED')),
  technician   text,
  resolution   text,
  opened_at    timestamptz not null default now(),
  closed_at    timestamptz,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index maintenance_tickets_pc_asset_id_idx on public.maintenance_tickets (pc_asset_id);
create index maintenance_tickets_status_idx on public.maintenance_tickets (status);

create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  diff        jsonb,
  created_at  timestamptz not null default now()
);

create or replace function public.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec_id  text;
  payload jsonb;
begin
  if (tg_op = 'DELETE') then
    rec_id := old.id::text;
    payload := jsonb_build_object('old', to_jsonb(old));
  elsif (tg_op = 'UPDATE') then
    rec_id := new.id::text;
    payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
  else
    rec_id := new.id::text;
    payload := jsonb_build_object('new', to_jsonb(new));
  end if;

  insert into public.audit_log (actor_id, action, entity, entity_id, diff)
  values (auth.uid(), tg_op, tg_table_name, rec_id, payload);

  if (tg_op = 'DELETE') then
    return old;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers updated_at + audit
-- ---------------------------------------------------------------------------

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger seat_statuses_set_updated_at
before update on public.seat_statuses
for each row execute function public.set_updated_at();

create trigger zones_set_updated_at
before update on public.zones
for each row execute function public.set_updated_at();

create trigger zone_rows_set_updated_at
before update on public.zone_rows
for each row execute function public.set_updated_at();

create trigger seats_set_updated_at
before update on public.seats
for each row execute function public.set_updated_at();

create trigger plan_annotations_set_updated_at
before update on public.plan_annotations
for each row execute function public.set_updated_at();

create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create trigger pc_assets_set_updated_at
before update on public.pc_assets
for each row execute function public.set_updated_at();

create trigger assignments_set_updated_at
before update on public.assignments
for each row execute function public.set_updated_at();

create trigger maintenance_tickets_set_updated_at
before update on public.maintenance_tickets
for each row execute function public.set_updated_at();

create trigger zones_audit
after insert or update or delete on public.zones
for each row execute function public.audit_trigger();

create trigger zone_rows_audit
after insert or update or delete on public.zone_rows
for each row execute function public.audit_trigger();

create trigger seats_audit
after insert or update or delete on public.seats
for each row execute function public.audit_trigger();

create trigger plan_annotations_audit
after insert or update or delete on public.plan_annotations
for each row execute function public.audit_trigger();

create trigger employees_audit
after insert or update or delete on public.employees
for each row execute function public.audit_trigger();

create trigger pc_assets_audit
after insert or update or delete on public.pc_assets
for each row execute function public.audit_trigger();

create trigger assignments_audit
after insert or update or delete on public.assignments
for each row execute function public.audit_trigger();

create trigger maintenance_tickets_audit
after insert or update or delete on public.maintenance_tickets
for each row execute function public.audit_trigger();
