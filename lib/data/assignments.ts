import type { SupabaseClient } from "@supabase/supabase-js";

import type { AssignmentLink } from "@/types/assignment";

type AssignmentRecord = {
  id: string;
  seat_id: string | null;
  employee_id: string | null;
  pc_asset_id: string | null;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  notes: string | null;
};

type SeatRef = {
  id: string;
  code: string;
  label: string | null;
  zone_id: string;
};

type EmployeeRef = { id: string; full_name: string };
type AssetRef = { id: string; asset_tag: string | null };
type ZoneRef = { id: string; name: string };

export async function hydrateAssignments(
  supabase: SupabaseClient,
  rows: AssignmentRecord[],
): Promise<AssignmentLink[]> {
  if (rows.length === 0) {
    return [];
  }

  const seatIds = unique(rows.map((row) => row.seat_id));
  const employeeIds = unique(rows.map((row) => row.employee_id));
  const assetIds = unique(rows.map((row) => row.pc_asset_id));

  const [seatResult, employeeResult, assetResult] = await Promise.all([
    seatIds.length
      ? supabase.from("seats").select("id, code, label, zone_id").in("id", seatIds)
      : Promise.resolve({ data: [] as SeatRef[], error: null }),
    employeeIds.length
      ? supabase
          .from("employees")
          .select("id, full_name")
          .in("id", employeeIds)
      : Promise.resolve({ data: [] as EmployeeRef[], error: null }),
    assetIds.length
      ? supabase
          .from("pc_assets")
          .select("id, asset_tag")
          .in("id", assetIds)
      : Promise.resolve({ data: [] as AssetRef[], error: null }),
  ]);

  const error = seatResult.error ?? employeeResult.error ?? assetResult.error;
  if (error) {
    throw new Error(`Lecture des affectations impossible : ${error.message}`);
  }

  const seats = (seatResult.data ?? []) as SeatRef[];
  const zoneIds = unique(seats.map((seat) => seat.zone_id));
  const zoneResult = zoneIds.length
    ? await supabase.from("zones").select("id, name").in("id", zoneIds)
    : { data: [] as ZoneRef[], error: null };
  if (zoneResult.error) {
    throw new Error(`Lecture des zones impossible : ${zoneResult.error.message}`);
  }

  const seatById = new Map(seats.map((seat) => [seat.id, seat]));
  const zoneNameById = new Map(
    ((zoneResult.data ?? []) as ZoneRef[]).map((zone) => [zone.id, zone.name]),
  );
  const employeeNameById = new Map(
    ((employeeResult.data ?? []) as EmployeeRef[]).map((e) => [e.id, e.full_name]),
  );
  const assetTagById = new Map(
    ((assetResult.data ?? []) as AssetRef[]).map((a) => [a.id, a.asset_tag]),
  );

  return rows.map((row) => {
    const seat = row.seat_id ? seatById.get(row.seat_id) ?? null : null;
    return {
      id: row.id,
      seatId: row.seat_id,
      seatCode: seat?.code ?? null,
      seatLabel: seat?.label ?? null,
      zoneName: seat ? zoneNameById.get(seat.zone_id) ?? null : null,
      pcAssetId: row.pc_asset_id,
      pcAssetTag: row.pc_asset_id
        ? assetTagById.get(row.pc_asset_id) ?? null
        : null,
      employeeId: row.employee_id,
      employeeName: row.employee_id
        ? employeeNameById.get(row.employee_id) ?? null
        : null,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      isActive: row.is_active,
      notes: row.notes,
    };
  });
}

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}
