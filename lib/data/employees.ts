import { createClient } from "@/lib/supabase/server";
import { hydrateAssignments } from "@/lib/data/assignments";
import type {
  Employee,
  EmployeeDetail,
  EmployeeFilters,
} from "@/types/employee";

type EmployeeRecord = {
  id: string;
  matricule: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  service: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
};

function toEmployee(row: EmployeeRecord): Employee {
  return {
    id: row.id,
    matricule: row.matricule,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    service: row.service,
    jobTitle: row.job_title,
    email: row.email,
    phone: row.phone,
    location: row.location,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%\\]/g, " ").trim();
}

export async function listEmployees(
  filters: EmployeeFilters = {},
): Promise<Employee[]> {
  const supabase = await createClient();
  let query = supabase
    .from("employees")
    .select(
      "id, matricule, first_name, last_name, full_name, service, job_title, email, phone, location, is_active, created_at",
    );

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) {
    query = query.or(
      `full_name.ilike.*${search}*,matricule.ilike.*${search}*,email.ilike.*${search}*,service.ilike.*${search}*`,
    );
  }
  if (filters.service) {
    query = query.eq("service", filters.service);
  }
  if (filters.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters.status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query
    .order("full_name", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(`Lecture des collaborateurs impossible : ${error.message}`);
  }
  return ((data ?? []) as EmployeeRecord[]).map(toEmployee);
}

export async function getEmployeeDetail(
  id: string,
): Promise<EmployeeDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, matricule, first_name, last_name, full_name, service, job_title, email, phone, location, is_active, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture du collaborateur impossible : ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("assignments")
    .select(
      "id, seat_id, employee_id, pc_asset_id, started_at, ended_at, is_active, notes",
    )
    .eq("employee_id", id)
    .order("started_at", { ascending: false });

  if (assignmentError) {
    throw new Error(
      `Lecture des affectations impossible : ${assignmentError.message}`,
    );
  }

  const assignments = await hydrateAssignments(
    supabase,
    (assignmentRows ?? []) as Parameters<typeof hydrateAssignments>[1],
  );

  return { ...toEmployee(data as EmployeeRecord), assignments };
}

export async function listServices(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("service")
    .not("service", "is", null)
    .order("service");

  if (error) {
    throw new Error(`Lecture des services impossible : ${error.message}`);
  }

  const services = new Set<string>();
  for (const row of (data ?? []) as { service: string | null }[]) {
    if (row.service) {
      services.add(row.service);
    }
  }
  return [...services];
}

export type SeatOption = {
  id: string;
  code: string;
  label: string | null;
  zoneName: string | null;
};

export async function listSeatOptions(): Promise<SeatOption[]> {
  const supabase = await createClient();
  const [seatResult, zoneResult] = await Promise.all([
    supabase
      .from("seats")
      .select("id, code, label, zone_id")
      .eq("is_active", true)
      .order("code")
      .limit(2000),
    supabase.from("zones").select("id, name"),
  ]);

  const error = seatResult.error ?? zoneResult.error;
  if (error) {
    throw new Error(`Lecture des positions impossible : ${error.message}`);
  }

  const zoneNameById = new Map(
    ((zoneResult.data ?? []) as { id: string; name: string }[]).map((zone) => [
      zone.id,
      zone.name,
    ]),
  );

  return (
    (seatResult.data ?? []) as {
      id: string;
      code: string;
      label: string | null;
      zone_id: string;
    }[]
  ).map((seat) => ({
    id: seat.id,
    code: seat.code,
    label: seat.label,
    zoneName: zoneNameById.get(seat.zone_id) ?? null,
  }));
}

export type EmployeeOption = {
  id: string;
  fullName: string;
  matricule: string | null;
};

export async function listEmployeeOptions(): Promise<EmployeeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name, matricule")
    .eq("is_active", true)
    .order("full_name")
    .limit(2000);

  if (error) {
    throw new Error(`Lecture des collaborateurs impossible : ${error.message}`);
  }
  return ((data ?? []) as { id: string; full_name: string; matricule: string | null }[]).map(
    (row) => ({ id: row.id, fullName: row.full_name, matricule: row.matricule }),
  );
}
