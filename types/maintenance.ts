export type MaintenancePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type MaintenanceStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING"
  | "RESOLVED"
  | "CLOSED";

export type MaintenanceTicket = {
  id: string;
  reference: string | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  technician: string | null;
  resolution: string | null;
  pcAssetId: string | null;
  pcAssetTag: string | null;
  seatId: string | null;
  seatCode: string | null;
  openedAt: string;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MaintenanceFilters = {
  search?: string;
  status?: string;
  priority?: string;
  assetId?: string;
  seatId?: string;
};
