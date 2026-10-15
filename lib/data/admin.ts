import { createClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "ADMIN" | "MANAGER" | "VIEWER";
  isActive: boolean;
  createdAt: string;
};

export type AdminSeatStatus = {
  code: string;
  label: string;
  color: string | null;
  icon: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type SettingEntry = {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string | null;
};

export type AuditEntry = {
  id: number;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diff: Record<string, unknown> | null;
  createdAt: string;
};

type ProfileRecord = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "ADMIN" | "MANAGER" | "VIEWER";
  is_active: boolean;
  created_at: string;
};

type SeatStatusRecord = {
  code: string;
  label: string;
  color: string | null;
  icon: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type SettingRecord = {
  key: string;
  value: string;
  description: string | null;
  updated_at: string | null;
};

type AuditRecord = {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: Record<string, unknown> | null;
  created_at: string;
};

export async function listUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Lecture des utilisateurs impossible : ${error.message}`);
  }

  return ((data ?? []) as ProfileRecord[]).map((profile) => ({
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    isActive: profile.is_active,
    createdAt: profile.created_at,
  }));
}

export async function listSeatStatusesFull(): Promise<AdminSeatStatus[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("seat_statuses")
    .select("code, label, color, icon, description, sort_order, is_active")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Lecture des statuts impossible : ${error.message}`);
  }

  return ((data ?? []) as SeatStatusRecord[]).map((record) => ({
    code: record.code,
    label: record.label,
    color: record.color,
    icon: record.icon,
    description: record.description,
    sortOrder: record.sort_order,
    isActive: record.is_active,
  }));
}

export type SettingsResult = {
  available: boolean;
  entries: SettingEntry[];
  error: string | null;
};

export async function listSettings(): Promise<SettingsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value, description, updated_at")
    .order("key", { ascending: true });

  if (error) {
    if (
      /relation "?public\.?app_settings"? does not exist/.test(error.message)
    ) {
      return {
        available: false,
        entries: [],
        error:
          "La table « app_settings » n'existe pas encore : appliquez la migration de la Phase 10.",
      };
    }
    return { available: false, entries: [], error: error.message };
  }

  return {
    available: true,
    entries: ((data ?? []) as SettingRecord[]).map((record) => ({
      key: record.key,
      value: record.value,
      description: record.description,
      updatedAt: record.updated_at,
    })),
    error: null,
  };
}

export async function listAuditEntries(limit = 200): Promise<AuditEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, entity, entity_id, diff, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Lecture du journal impossible : ${error.message}`);
  }

  return ((data ?? []) as AuditRecord[]).map((record) => ({
    id: record.id,
    actorId: record.actor_id,
    action: record.action,
    entity: record.entity,
    entityId: record.entity_id,
    diff: record.diff,
    createdAt: record.created_at,
  }));
}