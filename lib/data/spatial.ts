import { createClient } from "@/lib/supabase/server";
import type {
  PlanAnnotation,
  PlanAnnotationKind,
  PlanLayout,
  PlanRow,
  PlanSeat,
  PlanStatus,
  PlanZone,
  SeatAsset,
  WingType,
} from "@/types/plan";

type ZoneRecord = {
  id: string;
  code: string;
  name: string;
  wing: WingType;
  kind: string;
  department: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
};

type RowRecord = {
  id: string;
  zone_id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

type SeatRecord = {
  id: string;
  zone_id: string;
  row_id: string | null;
  code: string;
  label: string | null;
  kind: string;
  status: string;
  grid_row: number | null;
  grid_col: string | null;
  pos_x: number | null;
  pos_y: number | null;
  is_active: boolean;
};

type AnnotationRecord = {
  id: string;
  zone_id: string | null;
  label: string;
  kind: PlanAnnotationKind;
  grid_row: number | null;
  grid_col: string | null;
  row_span: number;
  col_span: number;
  is_active: boolean;
};

type StatusRecord = {
  code: string;
  label: string;
  color: string | null;
  icon: string | null;
  sort_order: number;
};

async function loadSeatAssets(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<SeatAsset[]> {
  const { data: assignments, error: assignmentError } = await supabase
    .from("assignments")
    .select("seat_id, pc_asset_id")
    .eq("is_active", true)
    .not("pc_asset_id", "is", null)
    .not("seat_id", "is", null);

  if (assignmentError) {
    throw new Error(
      `Lecture des affectations impossible : ${assignmentError.message}`,
    );
  }

  const rows = (assignments ?? []) as {
    seat_id: string;
    pc_asset_id: string;
  }[];
  if (rows.length === 0) {
    return [];
  }

  const assetIds = [...new Set(rows.map((row) => row.pc_asset_id))];
  const { data: assets, error: assetError } = await supabase
    .from("pc_assets")
    .select("id, asset_tag, model, asset_type")
    .in("id", assetIds)
    .eq("is_active", true);

  if (assetError) {
    throw new Error(`Lecture des équipements impossible : ${assetError.message}`);
  }

  const assetById = new Map(
    ((assets ?? []) as {
      id: string;
      asset_tag: string | null;
      model: string | null;
      asset_type: string | null;
    }[]).map((asset) => [asset.id, asset]),
  );

  return rows.flatMap((row) => {
    const asset = assetById.get(row.pc_asset_id);
    if (!asset) {
      return [];
    }
    return [
      {
        seatId: row.seat_id,
        id: asset.id,
        assetTag: asset.asset_tag,
        model: asset.model,
        assetType: asset.asset_type,
      },
    ];
  });
}

export async function getPlanLayout(): Promise<PlanLayout> {
  const supabase = await createClient();

  const [zonesRes, rowsRes, seatsRes, annotationsRes, statusesRes, seatAssets] =
    await Promise.all([
      supabase.from("zones").select("*").order("sort_order"),
      supabase.from("zone_rows").select("*").order("sort_order"),
      supabase
        .from("seats")
        .select(
          "id, zone_id, row_id, code, label, kind, status, grid_row, grid_col, pos_x, pos_y, is_active",
        )
        .order("code"),
      supabase
        .from("plan_annotations")
        .select("id, zone_id, label, kind, grid_row, grid_col, row_span, col_span, is_active")
        .eq("is_active", true)
        .order("grid_row"),
      supabase.from("seat_statuses").select("code, label, color, icon, sort_order").order("sort_order"),
      loadSeatAssets(supabase),
    ]);

  const failure =
    zonesRes.error ??
    rowsRes.error ??
    seatsRes.error ??
    annotationsRes.error ??
    statusesRes.error;

  if (failure) {
    throw new Error(`Lecture de la cartographie impossible : ${failure.message}`);
  }

  const zones: PlanZone[] = ((zonesRes.data ?? []) as ZoneRecord[]).map((z) => ({
    id: z.id,
    code: z.code,
    name: z.name,
    wing: z.wing,
    kind: z.kind,
    department: z.department,
    color: z.color,
    sortOrder: z.sort_order,
    isActive: z.is_active,
  }));

  const rows: PlanRow[] = ((rowsRes.data ?? []) as RowRecord[]).map((r) => ({
    id: r.id,
    zoneId: r.zone_id,
    label: r.label,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  }));

  const seats: PlanSeat[] = ((seatsRes.data ?? []) as SeatRecord[]).map((s) => ({
    id: s.id,
    zoneId: s.zone_id,
    rowId: s.row_id,
    code: s.code,
    label: s.label,
    kind: s.kind,
    status: s.status,
    gridRow: s.grid_row,
    gridCol: s.grid_col,
    posX: s.pos_x,
    posY: s.pos_y,
    isActive: s.is_active,
  }));

  const annotations: PlanAnnotation[] = (
    (annotationsRes.data ?? []) as AnnotationRecord[]
  ).map((a) => ({
    id: a.id,
    zoneId: a.zone_id,
    label: a.label,
    kind: a.kind,
    gridRow: a.grid_row,
    gridCol: a.grid_col,
    rowSpan: a.row_span,
    colSpan: a.col_span,
    isActive: a.is_active,
  }));

  const statuses: PlanStatus[] = ((statusesRes.data ?? []) as StatusRecord[]).map(
    (s) => ({
      code: s.code,
      label: s.label,
      color: s.color,
      icon: s.icon,
      sortOrder: s.sort_order,
    }),
  );

  return { zones, rows, seats, annotations, statuses, seatAssets };
}
