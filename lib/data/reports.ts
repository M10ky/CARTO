import { createClient } from "@/lib/supabase/server";
import {
  maintenancePriorityLabel,
  maintenancePriorityTone,
  maintenanceStatusLabel,
  maintenanceStatusTone,
  isOpenStatus,
} from "@/lib/constants/maintenance";
import { pcStatusLabel, pcStatusTone } from "@/lib/constants/inventory";
import type { BadgeTone } from "@/components/ui/badge";

export type StatBreakdown = {
  code: string;
  label: string;
  count: number;
  tone: BadgeTone;
};

export type ReportsOverview = {
  zones: number;
  rows: number;
  seats: { total: number; byStatus: StatBreakdown[] };
  employees: { total: number; active: number };
  assets: {
    total: number;
    active: number;
    byStatus: StatBreakdown[];
    byType: StatBreakdown[];
  };
  tickets: {
    total: number;
    open: number;
    byStatus: StatBreakdown[];
    byPriority: StatBreakdown[];
  };
};

function tally(
  values: string[],
  labelOf: (code: string) => string,
  toneOf: (code: string) => BadgeTone,
  order?: string[],
): StatBreakdown[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const codes = order
    ? order.filter((code) => counts.has(code))
    : [...counts.keys()].sort();
  return codes.map((code) => ({
    code,
    label: labelOf(code),
    count: counts.get(code) ?? 0,
    tone: toneOf(code),
  }));
}

export async function getReportsOverview(): Promise<ReportsOverview> {
  const supabase = await createClient();

  const [
    zonesResult,
    rowsResult,
    seatsResult,
    seatStatusesResult,
    employeesResult,
    assetsResult,
    ticketsResult,
  ] = await Promise.all([
    supabase.from("zones").select("id", { count: "exact", head: true }),
    supabase.from("zone_rows").select("id", { count: "exact", head: true }),
    supabase.from("seats").select("status"),
    supabase.from("seat_statuses").select("code, label"),
    supabase.from("employees").select("is_active"),
    supabase.from("pc_assets").select("status, asset_type, is_active"),
    supabase.from("maintenance_tickets").select("status, priority"),
  ]);

  const error =
    zonesResult.error ??
    rowsResult.error ??
    seatsResult.error ??
    seatStatusesResult.error ??
    employeesResult.error ??
    assetsResult.error ??
    ticketsResult.error;
  if (error) {
    throw new Error(`Calcul des statistiques impossible : ${error.message}`);
  }

  const seatStatusLabels = new Map(
    ((seatStatusesResult.data ?? []) as { code: string; label: string }[]).map(
      (row) => [row.code, row.label],
    ),
  );

  const seatStatuses = ((seatsResult.data ?? []) as { status: string }[]).map(
    (row) => row.status,
  );

  const employeeRows = (employeesResult.data ?? []) as { is_active: boolean }[];
  const employees = {
    total: employeeRows.length,
    active: employeeRows.filter((row) => row.is_active).length,
  };

  const assetRows = (assetsResult.data ?? []) as {
    status: string;
    asset_type: string | null;
    is_active: boolean;
  }[];
  const assets = {
    total: assetRows.length,
    active: assetRows.filter((row) => row.is_active).length,
    byStatus: tally(
      assetRows.map((row) => row.status),
      pcStatusLabel,
      pcStatusTone,
    ),
    byType: tally(
      assetRows.map((row) => row.asset_type ?? "OTHER"),
      (code) => code,
      () => "neutral" as BadgeTone,
    ),
  };

  const ticketRows = (ticketsResult.data ?? []) as {
    status: string;
    priority: string;
  }[];
  const tickets = {
    total: ticketRows.length,
    open: ticketRows.filter((row) => isOpenStatus(row.status)).length,
    byStatus: tally(
      ticketRows.map((row) => row.status),
      maintenanceStatusLabel,
      maintenanceStatusTone,
      ["OPEN", "IN_PROGRESS", "WAITING", "RESOLVED", "CLOSED"],
    ),
    byPriority: tally(
      ticketRows.map((row) => row.priority),
      maintenancePriorityLabel,
      maintenancePriorityTone,
      ["LOW", "NORMAL", "HIGH", "URGENT"],
    ),
  };

  return {
    zones: zonesResult.count ?? 0,
    rows: rowsResult.count ?? 0,
    seats: {
      total: seatStatuses.length,
      byStatus: tally(
        seatStatuses,
        (code) => seatStatusLabels.get(code) ?? code,
        () => "neutral",
      ),
    },
    employees,
    assets,
    tickets,
  };
}
