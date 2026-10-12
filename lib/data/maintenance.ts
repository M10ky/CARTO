import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { MaintenanceFilters, MaintenanceTicket } from "@/types/maintenance";

type TicketRecord = {
  id: string;
  reference: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  technician: string | null;
  resolution: string | null;
  pc_asset_id: string | null;
  employee_id: string | null;
  seat_id: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type AssetRef = { id: string; asset_tag: string | null };
type EmployeeRef = { id: string; full_name: string };
type SeatRef = { id: string; code: string };

const SELECT_COLUMNS =
  "id, reference, title, description, priority, status, technician, resolution, pc_asset_id, employee_id, seat_id, opened_at, closed_at, created_at, updated_at";

function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%\\]/g, " ").trim();
}

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

async function hydrateTickets(
  supabase: SupabaseClient,
  rows: TicketRecord[],
): Promise<MaintenanceTicket[]> {
  if (rows.length === 0) {
    return [];
  }

  const assetIds = unique(rows.map((row) => row.pc_asset_id));
  const employeeIds = unique(rows.map((row) => row.employee_id));
  const seatIds = unique(rows.map((row) => row.seat_id));

  const [assetResult, employeeResult, seatResult] = await Promise.all([
    assetIds.length
      ? supabase.from("pc_assets").select("id, asset_tag").in("id", assetIds)
      : Promise.resolve({ data: [] as AssetRef[], error: null }),
    employeeIds.length
      ? supabase.from("employees").select("id, full_name").in("id", employeeIds)
      : Promise.resolve({ data: [] as EmployeeRef[], error: null }),
    seatIds.length
      ? supabase.from("seats").select("id, code").in("id", seatIds)
      : Promise.resolve({ data: [] as SeatRef[], error: null }),
  ]);

  const error = assetResult.error ?? employeeResult.error ?? seatResult.error;
  if (error) {
    throw new Error(`Lecture des tickets impossible : ${error.message}`);
  }

  const assetTagById = new Map(
    ((assetResult.data ?? []) as AssetRef[]).map((asset) => [
      asset.id,
      asset.asset_tag,
    ]),
  );
  const employeeNameById = new Map(
    ((employeeResult.data ?? []) as EmployeeRef[]).map((employee) => [
      employee.id,
      employee.full_name,
    ]),
  );
  const seatCodeById = new Map(
    ((seatResult.data ?? []) as SeatRef[]).map((seat) => [seat.id, seat.code]),
  );

  return rows.map((row) => ({
    id: row.id,
    reference: row.reference,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    technician: row.technician,
    resolution: row.resolution,
    pcAssetId: row.pc_asset_id,
    pcAssetTag: row.pc_asset_id
      ? assetTagById.get(row.pc_asset_id) ?? null
      : null,
    employeeId: row.employee_id,
    employeeName: row.employee_id
      ? employeeNameById.get(row.employee_id) ?? null
      : null,
    seatId: row.seat_id,
    seatCode: row.seat_id ? seatCodeById.get(row.seat_id) ?? null : null,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listMaintenanceTickets(
  filters: MaintenanceFilters = {},
): Promise<MaintenanceTicket[]> {
  const supabase = await createClient();
  let query = supabase.from("maintenance_tickets").select(SELECT_COLUMNS);

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) {
    query = query.or(
      `title.ilike.*${search}*,reference.ilike.*${search}*,description.ilike.*${search}*,technician.ilike.*${search}*`,
    );
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.assetId) {
    query = query.eq("pc_asset_id", filters.assetId);
  }
  if (filters.employeeId) {
    query = query.eq("employee_id", filters.employeeId);
  }

  const { data, error } = await query
    .order("opened_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Lecture des tickets impossible : ${error.message}`);
  }
  return hydrateTickets(supabase, (data ?? []) as TicketRecord[]);
}

export async function getMaintenanceTicket(
  id: string,
): Promise<MaintenanceTicket | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tickets")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture du ticket impossible : ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const [ticket] = await hydrateTickets(supabase, [data as TicketRecord]);
  return ticket ?? null;
}

export async function listRecentMaintenanceTickets(
  limit = 5,
): Promise<MaintenanceTicket[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_tickets")
    .select(SELECT_COLUMNS)
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Lecture des tickets impossible : ${error.message}`);
  }
  return hydrateTickets(supabase, (data ?? []) as TicketRecord[]);
}
