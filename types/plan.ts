export type WingType = "CENTRAL" | "AILE_NORD" | "AILE_SUD";

export type PlanStatus = {
  code: string;
  label: string;
  color: string | null;
  icon: string | null;
  sortOrder: number;
};

export type PlanZone = {
  id: string;
  code: string;
  name: string;
  wing: WingType;
  kind: string;
  department: string | null;
  declaredPositions: number | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type PlanRow = {
  id: string;
  zoneId: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type PlanSeat = {
  id: string;
  zoneId: string;
  rowId: string | null;
  code: string;
  label: string | null;
  kind: string;
  status: string;
  gridRow: number | null;
  gridCol: string | null;
  posX: number | null;
  posY: number | null;
  isActive: boolean;
};

export type PlanAnnotation = {
  id: string;
  zoneId: string | null;
  label: string;
  kind: string;
  gridRow: number | null;
  gridCol: string | null;
  rowSpan: number;
  colSpan: number;
  isActive: boolean;
};

export type PlanLayout = {
  zones: PlanZone[];
  rows: PlanRow[];
  seats: PlanSeat[];
  annotations: PlanAnnotation[];
  statuses: PlanStatus[];
};
