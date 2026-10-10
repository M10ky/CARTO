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

const SELECT_COLUMNS =
  "id, asset_tag, serial_number, manufacturer, model, asset_type, os, status, notes, is_active, created_at";

function toAsset(row: PcAssetRecord): PcAsset {
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
  };
}

function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%\\]/g, " ").trim();
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
  return ((data ?? []) as PcAssetRecord[]).map(toAsset);
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
      "id, seat_id, employee_id, pc_asset_id, started_at, ended_at, is_active, notes",
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

  return { ...toAsset(data as PcAssetRecord), assignments };
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
