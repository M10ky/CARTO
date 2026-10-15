import { createClient } from "@/lib/supabase/server";
import { hydrateAssignments } from "@/lib/data/assignments";
import type { PcAsset, PcAssetDetail, PcAssetFilters } from "@/types/asset";

type PcAssetRecord = {
  id: string;
  asset_tag: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  asset_type: string | null;
  os: string | null;
  status: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
};

type AssignedSeat = NonNullable<PcAsset["assignedSeat"]>;

type AssignmentRow = {
  pc_asset_id: string;
  seat_id: string | null;
};

const SELECT_COLUMNS =
  "id, asset_tag, serial_number, manufacturer, model, asset_type, os, status, notes, is_active, created_at";

function toAsset(row: PcAssetRecord, assignedSeat: AssignedSeat | null): PcAsset {
  return {
    id: row.id,
    assetTag: row.asset_tag,
    serialNumber: row.serial_number,
    manufacturer: row.manufacturer,
    model: row.model,
    assetType: row.asset_type,
    os: row.os,
    status: row.status,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    assignedSeat,
  };
}

function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%\\]/g, " ").trim();
}

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => value !== null))];
}

async function loadAssignedSeats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  assetIds: string[],
): Promise<Map<string, AssignedSeat>> {
  const seatsByAsset = new Map<string, AssignedSeat>();
  if (assetIds.length === 0) {
    return seatsByAsset;
  }

  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("pc_asset_id, seat_id")
    .eq("is_active", true)
    .in("pc_asset_id", assetIds);

  if (error) {
    throw new Error(`Lecture des affectations impossible : ${error.message}`);
  }

  const seatIds = unique(
    ((assignments ?? []) as AssignmentRow[]).map((row) => row.seat_id),
  );
  if (seatIds.length === 0) {
    return seatsByAsset;
  }

  const [seatResult, zoneResult] = await Promise.all([
    supabase
      .from("seats")
      .select("id, code, zone_id")
      .in("id", seatIds),
    supabase.from("zones").select("id, name"),
  ]);

  const seatError = seatResult.error ?? zoneResult.error;
  if (seatError) {
    throw new Error(`Lecture des positions impossible : ${seatError.message}`);
  }

  const zoneNameById = new Map(
    ((zoneResult.data ?? []) as { id: string; name: string }[]).map((zone) => [
      zone.id,
      zone.name,
    ]),
  );

  const seatById = new Map(
    ((seatResult.data ?? []) as { id: string; code: string; zone_id: string }[]).map(
      (seat) => [seat.id, seat],
    ),
  );

  for (const row of (assignments ?? []) as AssignmentRow[]) {
    const seat = row.seat_id ? seatById.get(row.seat_id) ?? null : null;
    if (!seat) {
      continue;
    }
    seatsByAsset.set(row.pc_asset_id, {
      id: seat.id,
      code: seat.code,
      zoneName: zoneNameById.get(seat.zone_id) ?? null,
    });
  }

  return seatsByAsset;
}

export async function listPcAssets(
  filters: PcAssetFilters = {},
): Promise<PcAsset[]> {
  const supabase = await createClient();
  let query = supabase.from("pc_assets").select(SELECT_COLUMNS);

  const search = filters.search ? sanitizeSearch(filters.search) : "";
  if (search) {
    query = query.or(
      `asset_tag.ilike.*${search}*,serial_number.ilike.*${search}*,manufacturer.ilike.*${search}*,model.ilike.*${search}*,os.ilike.*${search}*`,
    );
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.assetType) {
    query = query.eq("asset_type", filters.assetType);
  }
  if (filters.active === "active") {
    query = query.eq("is_active", true);
  } else if (filters.active === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query
    .order("asset_tag", { ascending: true, nullsFirst: false })
    .limit(1000);

  if (error) {
    throw new Error(`Lecture du parc informatique impossible : ${error.message}`);
  }

  const rows = (data ?? []) as PcAssetRecord[];
  const seatsByAsset = await loadAssignedSeats(
    supabase,
    rows.map((row) => row.id),
  );

  return rows.map((row) => toAsset(row, seatsByAsset.get(row.id) ?? null));
}

export async function getPcAssetDetail(
  id: string,
): Promise<PcAssetDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pc_assets")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Lecture de l'équipement impossible : ${error.message}`);
  }
  if (!data) {
    return null;
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("assignments")
    .select(
      "id, seat_id, pc_asset_id, started_at, ended_at, is_active, notes",
    )
    .eq("pc_asset_id", id)
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

  const active = assignments.find((assignment) => assignment.isActive);
  const assignedSeat: AssignedSeat | null = active?.seatId && active.seatCode
    ? { id: active.seatId, code: active.seatCode, zoneName: active.zoneName }
    : null;

  return { ...toAsset(data as PcAssetRecord, assignedSeat), assignments };
}

export async function listAssetTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pc_assets")
    .select("asset_type")
    .not("asset_type", "is", null)
    .order("asset_type");

  if (error) {
    throw new Error(`Lecture des types impossible : ${error.message}`);
  }

  const types = new Set<string>();
  for (const row of (data ?? []) as { asset_type: string | null }[]) {
    if (row.asset_type) {
      types.add(row.asset_type);
    }
  }
  return [...types];
}

export type AssetOption = {
  id: string;
  assetTag: string | null;
  model: string | null;
};

export async function listAssetOptions(): Promise<AssetOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pc_assets")
    .select("id, asset_tag, model")
    .eq("is_active", true)
    .order("asset_tag", { ascending: true, nullsFirst: false })
    .limit(2000);

  if (error) {
    throw new Error(`Lecture du parc impossible : ${error.message}`);
  }
  return (
    (data ?? []) as { id: string; asset_tag: string | null; model: string | null }[]
  ).map((row) => ({
    id: row.id,
    assetTag: row.asset_tag,
    model: row.model,
  }));
}

export type AssignableAsset = AssetOption & { status: string };

export async function listAssignableAssets(): Promise<AssignableAsset[]> {
  const supabase = await createClient();

  const { data: assignedRows, error: assignedError } = await supabase
    .from("assignments")
    .select("pc_asset_id")
    .eq("is_active", true)
    .not("pc_asset_id", "is", null);
  if (assignedError) {
    throw new Error(
      `Lecture des affectations impossible : ${assignedError.message}`,
    );
  }

  const assignedIds = [
    ...new Set(
      ((assignedRows ?? []) as { pc_asset_id: string }[]).map(
        (row) => row.pc_asset_id,
      ),
    ),
  ];

  let query = supabase
    .from("pc_assets")
    .select("id, asset_tag, model, status")
    .eq("is_active", true)
    .not("status", "eq", "RETIRED");
  if (assignedIds.length > 0) {
    query = query.not("id", "in", `(${assignedIds.join(",")})`);
  }

  const { data, error } = await query
    .order("asset_tag", { ascending: true, nullsFirst: false })
    .limit(500);

  if (error) {
    throw new Error(`Lecture du parc disponible impossible : ${error.message}`);
  }
  return (
    (data ?? []) as {
      id: string;
      asset_tag: string | null;
      model: string | null;
      status: string;
    }[]
  ).map((row) => ({
    id: row.id,
    assetTag: row.asset_tag,
    model: row.model,
    status: row.status,
  }));
}
